const test = require("node:test");
const assert = require("node:assert/strict");
const { validationResult } = require("express-validator");
const {
  createAssessmentRules,
  treatmentPlanRules,
  labResultReviewRules,
} = require("../src/validators/assessmentValidators");
const { summarizeAssessment } = require("../src/services/aiAssessmentService");
const { extractTextFromAssessmentFile } = require("../src/services/ocrService");

const validate = async (rules, req) => {
  await Promise.all(rules.map((rule) => rule.run(req)));
  return validationResult(req).array().map(({ path, msg }) => ({ path, msg }));
};

test("accepts a valid patient assessment with unverified manual lab values", async () => {
  const errors = await validate(createAssessmentRules, {
    body: {
      doctor_id: "12",
      chief_complaint: "Recurring headache",
      symptoms: ["Headache"],
      severity: "4",
      symptom_trend: "stable",
      safety_answers: { trouble_breathing: "no" },
      lab_results: [{
        name: "Test A",
        value: "7.1",
        unit: "unit",
        reference_interval: "5-10",
        collected_at: "2026-10-28",
      }],
    },
    params: {},
  });
  assert.deepEqual(errors, []);
});

test("rejects invalid severity, safety answers, and empty lab values", async () => {
  const errors = await validate(createAssessmentRules, {
    body: {
      doctor_id: "12",
      chief_complaint: "Recurring headache",
      severity: "11",
      safety_answers: { invented_rule: "yes" },
      lab_results: [{ name: "Test A", value: "" }],
    },
    params: {},
  });
  assert.ok(errors.some((error) => error.path === "severity"));
  assert.ok(errors.some((error) => error.path === "safety_answers"));
  assert.ok(errors.some((error) => error.path === "lab_results[0]"));
});

test("requires clinician-authored assessment and explanation for a care plan", async () => {
  const errors = await validate(treatmentPlanRules, {
    body: {
      clinical_assessment: "",
      recommendations: "Clinician-authored care recommendation",
      patient_explanation: "",
    },
    params: { assessmentId: "5" },
  });
  assert.ok(errors.some((error) => error.path === "clinical_assessment"));
  assert.ok(errors.some((error) => error.path === "patient_explanation"));
});

test("validates clinician review data without permitting unsupported statuses", async () => {
  const errors = await validate(labResultReviewRules, {
    body: {
      verification_status: "automatically_diagnosed",
      name: "Test A",
      value: "7.1",
    },
    params: { assessmentId: "5", labIndex: "0" },
  });
  assert.ok(errors.some((error) => error.path === "verification_status"));
});

test("reports AI and OCR as not configured without producing medical output", async () => {
  const [aiResult, ocrResult] = await Promise.all([
    summarizeAssessment(1),
    extractTextFromAssessmentFile(1),
  ]);
  assert.equal(aiResult.status, "not_configured");
  assert.equal(aiResult.summary, null);
  assert.equal(ocrResult.status, "not_configured");
  assert.equal(ocrResult.text, null);
});
