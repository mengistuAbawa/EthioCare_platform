const summarizeAssessment = async () => ({
  status: "not_configured",
  summary: null,
  message: "No validated AI provider is configured. No health data is sent to an AI provider.",
});

module.exports = { summarizeAssessment };
