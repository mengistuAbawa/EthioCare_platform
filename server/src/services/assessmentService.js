const pool = require("../config/db");
const {
  prepareAssessmentFile,
  storeAssessmentFile,
  deleteAssessmentFile,
  createDownloadUrl,
} = require("./fileStorageService");

const assessmentColumns = `
  a.id, a.patient_id, a.doctor_id, a.chief_complaint, a.symptoms,
  a.medical_history, a.medications, a.allergies, a.lab_results, a.status,
  a.review_notes, a.submitted_at, a.reviewed_at, a.ocr_status,
  a.ai_summary_status, a.created_at, a.updated_at,
  patient.full_name AS patient_name,
  doctor_user.full_name AS doctor_name,
  d.specialty AS doctor_specialty
`;

const assessmentFrom = `
  FROM patient_health_assessments a
  JOIN users patient ON patient.id = a.patient_id
  JOIN doctors d ON d.id = a.doctor_id
  JOIN users doctor_user ON doctor_user.id = d.user_id
`;

const listFiles = async (client, assessmentId) => {
  const result = await client.query(
    `SELECT id, original_filename, content_type, file_size, upload_status, created_at
       FROM assessment_files
      WHERE assessment_id = $1
      ORDER BY created_at`,
    [assessmentId]
  );
  return result.rows;
};

const createAssessment = async (patientId, input) => {
  const doctorResult = await pool.query(
    `SELECT d.id
       FROM doctors d
       JOIN users u ON u.id = d.user_id AND u.role = 'doctor' AND u.is_active = TRUE
       JOIN clinics c ON c.id = d.clinic_id AND c.verification_status = 'verified'
      WHERE d.id = $1 AND d.is_active = TRUE AND d.is_profile_approved = TRUE`,
    [input.doctor_id]
  );
  if (doctorResult.rowCount === 0) {
    const error = new Error("Choose an active, verified doctor to receive this assessment.");
    error.status = 400;
    throw error;
  }
  const result = await pool.query(
    `INSERT INTO patient_health_assessments
       (patient_id, doctor_id, chief_complaint, symptoms, medical_history, medications, allergies, lab_results)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb)
     RETURNING id, patient_id, doctor_id, status, created_at`,
    [
      patientId,
      doctorResult.rows[0].id,
      input.chief_complaint.trim(),
      JSON.stringify(input.symptoms || []),
      input.medical_history || "",
      input.medications || "",
      input.allergies || "",
      JSON.stringify(input.lab_results || []),
    ]
  );
  return result.rows[0];
};

const listPatientAssessments = async (patientId) => {
  const result = await pool.query(
    `SELECT ${assessmentColumns}
       ${assessmentFrom}
      WHERE a.patient_id = $1
      ORDER BY a.created_at DESC`,
    [patientId]
  );
  return result.rows;
};

const getAssessmentById = async (assessmentId) => {
  const result = await pool.query(
    `SELECT ${assessmentColumns}
       ${assessmentFrom}
      WHERE a.id = $1`,
    [assessmentId]
  );
  if (result.rowCount === 0) return null;
  const assessment = result.rows[0];
  assessment.files = await listFiles(pool, assessmentId);
  return assessment;
};

const submitAssessment = async (assessmentId, patientId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const assessmentResult = await client.query(
      `SELECT status
         FROM patient_health_assessments
        WHERE id = $1 AND patient_id = $2
        FOR UPDATE`,
      [assessmentId, patientId]
    );
    if (assessmentResult.rowCount === 0 || assessmentResult.rows[0].status !== "draft") {
      const error = new Error("Only your draft assessments can be submitted.");
      error.status = 409;
      throw error;
    }

    const fileResult = await client.query(
      `SELECT count(*) FILTER (WHERE upload_status = 'pending')::int AS pending
         FROM assessment_files WHERE assessment_id = $1`,
      [assessmentId]
    );
    if (fileResult.rows[0].pending > 0) {
      const error = new Error("Finish uploading or remove pending files before submitting.");
      error.status = 400;
      throw error;
    }

    const result = await client.query(
      `UPDATE patient_health_assessments
          SET status = 'submitted', submitted_at = now()
        WHERE id = $1 AND patient_id = $2
        RETURNING id, status, submitted_at`,
      [assessmentId, patientId]
    );
    await client.query(
      `INSERT INTO assessment_processing_jobs (assessment_id, job_type, status, completed_at)
       VALUES ($1, 'ocr', 'disabled', now()), ($1, 'ai_summary', 'disabled', now())
       ON CONFLICT (assessment_id, job_type) DO NOTHING`,
      [assessmentId]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Assessment submission rollback failed:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
};

const getDoctorInbox = async (doctorUserId) => {
  const result = await pool.query(
    `SELECT ${assessmentColumns}
       ${assessmentFrom}
       JOIN doctors assigned_doctor ON assigned_doctor.id = a.doctor_id
      WHERE assigned_doctor.user_id = $1
        AND a.status IN ('submitted', 'in_review')
      ORDER BY a.submitted_at ASC`,
    [doctorUserId]
  );
  return result.rows;
};

const reviewAssessment = async (assessmentId, doctorUserId, reviewNotes, status) => {
  const result = await pool.query(
    `UPDATE patient_health_assessments a
        SET review_notes = $3,
            status = $4,
            reviewed_at = CASE WHEN $4 = 'reviewed' THEN now() ELSE NULL END
       FROM doctors d
      WHERE a.id = $1
        AND d.id = a.doctor_id
        AND d.user_id = $2
        AND a.status IN ('submitted', 'in_review', 'reviewed')
      RETURNING a.id, a.status, a.review_notes, a.reviewed_at`,
    [assessmentId, doctorUserId, reviewNotes.trim(), status]
  );
  if (result.rowCount === 0) {
    const error = new Error("This assessment is not assigned to you or cannot be reviewed.");
    error.status = 404;
    throw error;
  }
  return result.rows[0];
};

const createAssessmentFileUpload = async (assessmentId, file) => {
  const prepared = prepareAssessmentFile(assessmentId, file);
  const client = await pool.connect();
  let fileRecord;
  try {
    await client.query("BEGIN");
    const stateResult = await client.query(
      `SELECT status FROM patient_health_assessments WHERE id = $1 FOR UPDATE`,
      [assessmentId]
    );
    if (stateResult.rowCount === 0 || stateResult.rows[0].status !== "draft") {
      const error = new Error("Files can only be added to your assessment draft.");
      error.status = 409;
      throw error;
    }
    const countResult = await client.query(
      "SELECT count(*)::int AS file_count FROM assessment_files WHERE assessment_id = $1",
      [assessmentId]
    );
    if (countResult.rows[0].file_count >= 5) {
      const error = new Error("An assessment can include no more than 5 files.");
      error.status = 400;
      throw error;
    }
    const result = await client.query(
      `INSERT INTO assessment_files
         (assessment_id, object_key, original_filename, content_type, file_size, upload_status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, original_filename, content_type, file_size, upload_status, created_at`,
      [assessmentId, prepared.objectKey, prepared.filename, prepared.contentType, prepared.size]
    );
    fileRecord = result.rows[0];
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Assessment file reservation rollback failed:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }

  try {
    await storeAssessmentFile(prepared, file);
    const result = await pool.query(
      `UPDATE assessment_files
          SET upload_status = 'uploaded'
        WHERE id = $1 AND assessment_id = $2 AND upload_status = 'pending'
        RETURNING id, original_filename, content_type, file_size, upload_status, created_at`,
      [fileRecord.id, assessmentId]
    );
    if (result.rowCount === 0) {
      throw new Error("The assessment file upload reservation is no longer available.");
    }
    return result.rows[0];
  } catch (error) {
    try {
      await deleteAssessmentFile(prepared.objectKey);
    } catch (cleanupError) {
      console.error("Failed to remove incomplete assessment file:", cleanupError.message);
    }
    try {
      await pool.query(
        "DELETE FROM assessment_files WHERE id = $1 AND upload_status = 'pending'",
        [fileRecord.id]
      );
    } catch (cleanupError) {
      console.error("Failed to remove incomplete assessment file metadata:", cleanupError.message);
    }
    throw error;
  }
};

const getAssessmentFileDownloadUrl = async (assessmentId, fileId) => {
  const result = await pool.query(
    `SELECT object_key, upload_status
       FROM assessment_files WHERE id = $1 AND assessment_id = $2`,
    [fileId, assessmentId]
  );
  if (result.rowCount === 0 || result.rows[0].upload_status !== "uploaded") {
    const error = new Error("Uploaded assessment file not found.");
    error.status = 404;
    throw error;
  }
  return createDownloadUrl(result.rows[0].object_key);
};

module.exports = {
  createAssessment,
  listPatientAssessments,
  getAssessmentById,
  submitAssessment,
  getDoctorInbox,
  reviewAssessment,
  createAssessmentFileUpload,
  getAssessmentFileDownloadUrl,
};
