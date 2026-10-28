const extractTextFromAssessmentFile = async () => ({
  status: "disabled",
  text: null,
  message: "OCR is disabled. Assessment files are not sent to an OCR provider.",
});

module.exports = { extractTextFromAssessmentFile };
