const pool = require("../config/db");

const getAiProviderConfig = () => {
  const gatewayToken = process.env.NEON_AI_GATEWAY_TOKEN?.trim();
  const gatewayBaseUrl = process.env.NEON_AI_GATEWAY_BASE_URL?.trim();

  if (gatewayToken && gatewayBaseUrl) {
    const baseUrl = gatewayBaseUrl.replace(/\/+$/, "");
    return {
      apiKey: gatewayToken,
      baseUrl: baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`,
      model: process.env.NEON_AI_GATEWAY_MODEL?.trim() ||
        process.env.OPENAI_MODEL?.trim() ||
        "gpt-4o-mini",
      provider: "Neon AI Gateway",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    return {
      apiKey,
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      provider: "OpenAI",
    };
  }

  return null;
};

const summarizeAssessment = async (assessmentId) => {
  const provider = getAiProviderConfig();
  if (!provider) {
    return {
      status: "not_configured",
      summary: null,
      message: "No validated AI provider is configured. No health data is sent to an AI provider.",
    };
  }

  const result = await pool.query(
    `SELECT chief_complaint, symptoms, medical_history, medications, allergies,
            symptom_onset, symptom_duration, symptom_frequency, severity,
            symptom_trend, previous_treatment, additional_notes, safety_answers,
            lab_results
       FROM patient_health_assessments
      WHERE id = $1`,
    [assessmentId]
  );

  if (result.rowCount === 0) {
    throw new Error("Assessment not found.");
  }

  const assessment = result.rows[0];
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            "You produce a concise clinician-support summary of patient-reported health information. " +
            "Do not diagnose, prescribe, recommend treatment, or claim that information is confirmed. " +
            "Clearly label uncertainty, urgency, and that clinician verification is required.",
        },
        {
          role: "user",
          content: JSON.stringify(assessment),
        },
      ],
    }),
  });

  if (!response.ok) {
    const providerError = await response.text();
    throw new Error(`${provider.provider} request failed (${response.status}): ${providerError.slice(0, 500)}`);
  }

  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    throw new Error(`${provider.provider} returned an empty summary.`);
  }

  return {
    status: "completed",
    summary,
    message: "AI summary completed. A clinician must verify it independently.",
  };
};

module.exports = { getAiProviderConfig, summarizeAssessment };
