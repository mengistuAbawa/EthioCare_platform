const extractTextFromAssessmentFile = async () => ({
  status: "not_configured",
  text: null,
  message: "No validated OCR provider is configured. Assessment files are not sent to an OCR provider.",
});

module.exports = { extractTextFromAssessmentFile };
