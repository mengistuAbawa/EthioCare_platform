const pool = require("../config/db");
const {
  prepareAssessmentFile,
  storeAssessmentFile,
  deleteAssessmentFile,
  createDownloadUrl,
} = require("./fileStorageService");

const assessmentColumns = `
  a.id, a.patient_id, a.doctor_id, a.clinic_id, a.chief_complaint, a.symptoms,
  a.medical_history, a.medications, a.allergies, a.lab_results, a.status,
  a.symptom_onset, a.symptom_duration, a.symptom_frequency, a.severity,
  a.symptom_trend, a.previous_treatment, a.additional_notes, a.safety_answers,
  a.review_notes, a.submitted_at, a.reviewed_at, a.ocr_status,
  a.ai_summary_status, a.created_at, a.updated_at,
  (SELECT count(*)::int
     FROM treatment_plans approved_plan
    WHERE approved_plan.assessment_id = a.id AND approved_plan.status = 'approved')
    AS approved_treatment_plan_count,
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

const normalizeLabResults = (results = []) => results.map((result) => ({
  name: result.name.trim(),
  value: result.value.trim(),
  unit: (result.unit || "").trim(),
  reference_interval: (result.reference_interval || "").trim(),
  lab_name: (result.lab_name || "").trim(),
  collected_at: result.collected_at || null,
  source: "patient_entered",
  verification_status: "unverified",
}));

const assessmentValues = (input) => ([
  input.chief_complaint.trim(),
  JSON.stringify(input.symptoms || []),
  input.medical_history || "",
  input.medications || "",
  input.allergies || "",
  JSON.stringify(normalizeLabResults(input.lab_results || [])),
  input.symptom_onset || "",
  input.symptom_duration || "",
  input.symptom_frequency || "",
  input.severity === "" || input.severity === undefined ? null : input.severity,
  input.symptom_trend || "",
  input.previous_treatment || "",
  input.additional_notes || "",
  JSON.stringify(input.safety_answers || {}),
]);

const createAssessment = async (patientId, input) => {
  const doctorResult = await pool.query(
    `SELECT d.id
       FROM doctors d
       JOIN users u ON u.id = d.user_id AND u.role = 'doctor' AND u.is_active = TRUE
       JOIN clinics c ON c.id = d.clinic_id
                      AND c.verification_status = 'verified'
                      AND c.operational_status = 'active'
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
       (patient_id, doctor_id, chief_complaint, symptoms, medical_history, medications, allergies,
        lab_results, symptom_onset, symptom_duration, symptom_frequency, severity, symptom_trend,
        previous_treatment, additional_notes, safety_answers)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
     RETURNING id, patient_id, doctor_id, clinic_id, status, created_at`,
    [
      patientId,
      doctorResult.rows[0].id,
      ...assessmentValues(input),
    ]
  );
  return result.rows[0];
};

const updateDraftAssessment = async (assessmentId, patientId, input) => {
  const result = await pool.query(
    `UPDATE patient_health_assessments
        SET chief_complaint = $3,
            symptoms = $4::jsonb,
            medical_history = $5,
            medications = $6,
            allergies = $7,
            lab_results = $8::jsonb,
            symptom_onset = $9,
            symptom_duration = $10,
            symptom_frequency = $11,
            severity = $12,
            symptom_trend = $13,
            previous_treatment = $14,
            additional_notes = $15,
            safety_answers = $16::jsonb
      WHERE id = $1 AND patient_id = $2 AND status = 'draft'
      RETURNING id, patient_id, doctor_id, status, updated_at`,
    [assessmentId, patientId, ...assessmentValues(input)]
  );
  if (result.rowCount === 0) {
    const error = new Error("Only your own draft assessment can be updated.");
    error.status = 409;
    throw error;
  }
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

const getAssessmentById = async (assessmentId, viewerRole) => {
  const result = await pool.query(
    `SELECT ${assessmentColumns}
       ${assessmentFrom}
      WHERE a.id = $1`,
    [assessmentId]
  );
  if (result.rowCount === 0) return null;
  const assessment = result.rows[0];
  assessment.files = await listFiles(pool, assessmentId);
  const labReviewResult = await pool.query(
    `SELECT lab.result_index, lab.version, lab.verification_status, lab.original_result,
            lab.reviewed_result, lab.created_at, reviewer.full_name AS reviewer_name
       FROM doctor_assessment_lab_versions lab
       JOIN users reviewer ON reviewer.id = lab.doctor_user_id
      WHERE lab.assessment_id = $1
      ORDER BY lab.result_index, lab.version DESC`,
    [assessmentId]
  );
  assessment.lab_reviews = labReviewResult.rows;
  if (viewerRole === "doctor") {
    const [reviewResult, planResult] = await Promise.all([
      pool.query(
        `SELECT version, review_notes, status, created_at
           FROM doctor_assessment_review_versions
          WHERE assessment_id = $1
          ORDER BY version DESC`,
        [assessmentId]
      ),
      pool.query(
        `SELECT id, version, status, plan_payload, approved_at, created_at
           FROM treatment_plans
          WHERE assessment_id = $1
          ORDER BY version DESC`,
        [assessmentId]
      ),
    ]);
    assessment.review_history = reviewResult.rows;
    assessment.treatment_plans = planResult.rows;
  }
  return assessment;
};

const reviewLabResult = async (assessmentId, resultIndex, doctorUserId, input) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const assessmentResult = await client.query(
      `SELECT a.lab_results
         FROM patient_health_assessments a
         JOIN doctors d ON d.id = a.doctor_id
        WHERE a.id = $1 AND d.user_id = $2
           AND a.status IN ('submitted', 'in_review', 'reviewed')
        FOR UPDATE OF a`,
      [assessmentId, doctorUserId]
    );
    if (assessmentResult.rowCount === 0) {
      const error = new Error("This assessment is not assigned to you or cannot be reviewed.");
      error.status = 404;
      throw error;
    }
    const labResults = assessmentResult.rows[0].lab_results;
    if (!Array.isArray(labResults) || resultIndex >= labResults.length) {
      const error = new Error("Lab result not found.");
      error.status = 404;
      throw error;
    }
    const versionResult = await client.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
         FROM doctor_assessment_lab_versions
        WHERE assessment_id = $1 AND result_index = $2`,
      [assessmentId, resultIndex]
    );
    const reviewedResult = {
      name: input.name.trim(),
      value: input.value.trim(),
      unit: (input.unit || "").trim(),
      reference_interval: (input.reference_interval || "").trim(),
      lab_name: (input.lab_name || "").trim(),
      collected_at: input.collected_at || null,
    };
    const result = await client.query(
      `INSERT INTO doctor_assessment_lab_versions
         (assessment_id, result_index, doctor_user_id, version, verification_status, original_result, reviewed_result)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
       RETURNING result_index, version, verification_status, original_result, reviewed_result, created_at`,
      [
        assessmentId,
        resultIndex,
        doctorUserId,
        versionResult.rows[0].next_version,
        input.verification_status,
        JSON.stringify(labResults[resultIndex]),
        JSON.stringify(reviewedResult),
      ]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Lab result review rollback failed:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
};

const submitAssessment = async (assessmentId, patientId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const assessmentResult = await client.query(
      `SELECT status, doctor_id
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
       VALUES ($1, 'ocr', 'not_configured', now()), ($1, 'ai_summary', 'not_configured', now())
       ON CONFLICT (assessment_id, job_type) DO NOTHING`,
      [assessmentId]
    );
    const doctorUser = await client.query(
      "SELECT user_id FROM doctors WHERE id = $1",
      [assessmentResult.rows[0].doctor_id]
    );
    await client.query(
      `INSERT INTO notifications (recipient_id, title, message, type)
       SELECT recipient_id, title, message, type
         FROM (VALUES
           ($1::bigint, 'Assessment submitted', 'Your assessment was submitted. Sign in to view its status.', 'general'),
           ($2::bigint, 'Assessment ready for review', 'A patient assessment is ready in your assigned review queue.', 'general')
         ) AS notification(recipient_id, title, message, type)
        WHERE (SELECT notify_general_enabled FROM platform_settings WHERE id = 1)`,
      [patientId, doctorUser.rows[0].user_id]
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
      JOIN clinics assigned_clinic
        ON assigned_clinic.id = assigned_doctor.clinic_id
       AND assigned_clinic.verification_status = 'verified'
       AND assigned_clinic.operational_status = 'active'
      WHERE assigned_doctor.user_id = $1
        AND a.status IN ('submitted', 'in_review')
      ORDER BY a.submitted_at ASC`,
    [doctorUserId]
  );
  return result.rows;
};

const reviewAssessment = async (assessmentId, doctorUserId, reviewNotes, status) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const assessmentResult = await client.query(
      `SELECT a.id, a.patient_id, a.status
         FROM patient_health_assessments a
         JOIN doctors d ON d.id = a.doctor_id
        WHERE a.id = $1 AND d.user_id = $2
          AND a.status IN ('submitted', 'in_review', 'reviewed')
        FOR UPDATE OF a`,
      [assessmentId, doctorUserId]
    );
    if (assessmentResult.rowCount === 0) {
      const error = new Error("This assessment is not assigned to you or cannot be reviewed.");
      error.status = 404;
      throw error;
    }
    if (assessmentResult.rows[0].status === "reviewed" && status !== "reviewed") {
      const error = new Error("A reviewed assessment cannot be returned to an earlier status.");
      error.status = 409;
      throw error;
    }

    const versionResult = await client.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
         FROM doctor_assessment_review_versions
        WHERE assessment_id = $1`,
      [assessmentId]
    );
    await client.query(
      `INSERT INTO doctor_assessment_review_versions
         (assessment_id, doctor_user_id, version, review_notes, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [assessmentId, doctorUserId, versionResult.rows[0].next_version, reviewNotes.trim(), status]
    );
    const result = await client.query(
      `UPDATE patient_health_assessments
          SET review_notes = $2,
              status = $3,
              reviewed_at = CASE WHEN $3 = 'reviewed' THEN COALESCE(reviewed_at, now()) ELSE reviewed_at END
        WHERE id = $1 AND status IN ('submitted', 'in_review', 'reviewed')
        RETURNING id, status, review_notes, reviewed_at`,
      [assessmentId, reviewNotes.trim(), status]
    );
    await client.query(
      `INSERT INTO notifications (recipient_id, title, message, type)
       SELECT $1, 'Assessment review updated', 'Your clinician updated the review of an assessment. Sign in to view it.'
        WHERE (SELECT notify_general_enabled FROM platform_settings WHERE id = 1)`,
      [assessmentResult.rows[0].patient_id]
    );
    await client.query("COMMIT");
    return { ...result.rows[0], version: versionResult.rows[0].next_version };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Assessment review rollback failed:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
};

const createTreatmentPlan = async (assessmentId, doctorUserId, payload) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const assessmentResult = await client.query(
      `SELECT a.id
         FROM patient_health_assessments a
         JOIN doctors d ON d.id = a.doctor_id
        WHERE a.id = $1 AND d.user_id = $2
           AND a.status = 'reviewed'
        FOR UPDATE OF a`,
      [assessmentId, doctorUserId]
    );
    if (assessmentResult.rowCount === 0) {
      const error = new Error("This assessment is not assigned to you or cannot have a treatment plan.");
      error.status = 404;
      throw error;
    }
    const versionResult = await client.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
         FROM treatment_plans WHERE assessment_id = $1`,
      [assessmentId]
    );
    const planPayload = {
      clinical_assessment: payload.clinical_assessment.trim(),
      recommendations: payload.recommendations.trim(),
      medication_instructions: (payload.medication_instructions || "").trim(),
      non_medication_care: (payload.non_medication_care || "").trim(),
      investigations: (payload.investigations || "").trim(),
      referral: (payload.referral || "").trim(),
      warning_signs: (payload.warning_signs || "").trim(),
      follow_up_date: payload.follow_up_date || null,
      patient_explanation: payload.patient_explanation.trim(),
      medication_safety_check: "unavailable",
    };
    const result = await client.query(
      `INSERT INTO treatment_plans
         (assessment_id, doctor_user_id, version, plan_payload)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id, assessment_id, version, status, plan_payload, created_at`,
      [assessmentId, doctorUserId, versionResult.rows[0].next_version, JSON.stringify(planPayload)]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Treatment plan draft rollback failed:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
};

const updateTreatmentPlanDraft = async (assessmentId, planId, doctorUserId, payload) => {
  const planPayload = {
    clinical_assessment: payload.clinical_assessment.trim(),
    recommendations: payload.recommendations.trim(),
    medication_instructions: (payload.medication_instructions || "").trim(),
    non_medication_care: (payload.non_medication_care || "").trim(),
    investigations: (payload.investigations || "").trim(),
    referral: (payload.referral || "").trim(),
    warning_signs: (payload.warning_signs || "").trim(),
    follow_up_date: payload.follow_up_date || null,
    patient_explanation: payload.patient_explanation.trim(),
    medication_safety_check: "unavailable",
  };
  const result = await pool.query(
    `UPDATE treatment_plans p
        SET plan_payload = $4::jsonb
       FROM patient_health_assessments a
       JOIN doctors d ON d.id = a.doctor_id
      WHERE p.id = $1 AND p.assessment_id = $2 AND p.status = 'draft'
        AND a.id = p.assessment_id AND d.user_id = $3
      RETURNING p.id, p.assessment_id, p.version, p.status, p.plan_payload, p.created_at`,
    [planId, assessmentId, doctorUserId, JSON.stringify(planPayload)]
  );
  if (result.rowCount === 0) {
    const error = new Error("Only a draft plan for an assessment assigned to you can be updated.");
    error.status = 404;
    throw error;
  }
  return result.rows[0];
};

const approveTreatmentPlan = async (assessmentId, planId, doctorUserId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const planResult = await client.query(
      `SELECT p.id, p.status, a.patient_id
         FROM treatment_plans p
         JOIN patient_health_assessments a ON a.id = p.assessment_id
         JOIN doctors d ON d.id = a.doctor_id
        WHERE p.id = $1 AND p.assessment_id = $2 AND d.user_id = $3
          AND a.status = 'reviewed'
        FOR UPDATE OF p, a`,
      [planId, assessmentId, doctorUserId]
    );
    if (planResult.rowCount === 0) {
      const error = new Error("Treatment plan not found for an assessment assigned to you.");
      error.status = 404;
      throw error;
    }
    if (planResult.rows[0].status !== "draft") {
      const error = new Error("Only a draft treatment plan can be approved.");
      error.status = 409;
      throw error;
    }
    await client.query(
      `UPDATE treatment_plans
          SET status = 'superseded'
        WHERE assessment_id = $1 AND status = 'approved'`,
      [assessmentId]
    );
    const result = await client.query(
      `UPDATE treatment_plans
          SET status = 'approved', approved_at = now()
        WHERE id = $1 AND assessment_id = $2
        RETURNING id, assessment_id, version, status, plan_payload, approved_at`,
      [planId, assessmentId]
    );
    await client.query(
      `INSERT INTO notifications (recipient_id, title, message, type)
       SELECT $1, 'Doctor-approved care plan available', 'A clinician approved a care plan. Sign in to view it.'
        WHERE (SELECT notify_general_enabled FROM platform_settings WHERE id = 1)`,
      [planResult.rows[0].patient_id]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Treatment plan approval rollback failed:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
};

const getPatientTreatmentPlan = async (assessmentId, patientId) => {
  const result = await pool.query(
    `SELECT p.id, p.assessment_id, p.version, p.plan_payload, p.approved_at,
            doctor.full_name AS doctor_name
       FROM treatment_plans p
       JOIN patient_health_assessments a ON a.id = p.assessment_id
       JOIN users doctor ON doctor.id = p.doctor_user_id
      WHERE p.assessment_id = $1 AND a.patient_id = $2 AND p.status = 'approved'
      ORDER BY p.version DESC
      LIMIT 1`,
    [assessmentId, patientId]
  );
  return result.rows[0] || null;
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
  updateDraftAssessment,
  listPatientAssessments,
  getAssessmentById,
  reviewLabResult,
  submitAssessment,
  getDoctorInbox,
  reviewAssessment,
  createTreatmentPlan,
  updateTreatmentPlanDraft,
  approveTreatmentPlan,
  getPatientTreatmentPlan,
  createAssessmentFileUpload,
  getAssessmentFileDownloadUrl,
};
