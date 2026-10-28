const summarizeAssessment = async () => ({
  status: "disabled",
  summary: null,
  message: "AI summaries are disabled. No health data is sent to an AI provider.",
});

module.exports = { summarizeAssessment };
