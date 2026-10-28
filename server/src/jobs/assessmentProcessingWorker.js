const pool = require("../config/db");
const { extractTextFromAssessmentFile } = require("../services/ocrService");
const { summarizeAssessment } = require("../services/aiAssessmentService");

const processJob = async (job) => {
  const result = job.job_type === "ocr"
    ? await extractTextFromAssessmentFile(job.assessment_id)
    : await summarizeAssessment(job.assessment_id);
  const status = result.status === "disabled" ? "disabled" : result.status;
  const column = job.job_type === "ocr" ? "ocr_status" : "ai_summary_status";

  await pool.query(
    `UPDATE assessment_processing_jobs
        SET status = $2, completed_at = now()
      WHERE id = $1`,
    [job.id, status]
  );
  await pool.query(
    `UPDATE patient_health_assessments SET ${column} = $2 WHERE id = $1`,
    [job.assessment_id, status]
  );
};

const runAssessmentProcessingWorker = async () => {
  const result = await pool.query(
    `SELECT id, assessment_id, job_type
       FROM assessment_processing_jobs
      WHERE status = 'pending'
      ORDER BY created_at
      LIMIT 10`
  );

  for (const job of result.rows) {
    try {
      await processJob(job);
    } catch (error) {
      console.error(`Assessment processing job ${job.id} failed:`, error.message);
      await pool.query(
        `UPDATE assessment_processing_jobs SET status = 'failed', completed_at = now() WHERE id = $1`,
        [job.id]
      );
      const column = job.job_type === "ocr" ? "ocr_status" : "ai_summary_status";
      await pool.query(
        `UPDATE patient_health_assessments SET ${column} = 'failed' WHERE id = $1`,
        [job.assessment_id]
      );
    }
  }
  return result.rowCount;
};

if (require.main === module) {
  runAssessmentProcessingWorker()
    .then((count) => console.log(`Processed ${count} assessment processing jobs.`))
    .catch((error) => {
      console.error("Assessment worker failed:", error.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { runAssessmentProcessingWorker };
