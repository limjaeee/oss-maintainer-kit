const RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5";

export function buildResponsesPayload({ input, model = DEFAULT_MODEL }) {
  return {
    model,
    input
  };
}

export async function requestOpenAIResponse({
  input,
  model = DEFAULT_MODEL,
  apiKey,
  fetchImpl = fetch
}) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to call the OpenAI Responses API.");
  }

  const response = await fetchImpl(RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildResponsesPayload({ input, model }))
  });

  if (!response.ok) {
    const body = await safeReadError(response);
    throw new Error(`OpenAI request failed with status ${response.status}: ${redact(apiKey, body)}`);
  }

  const json = await response.json();
  return {
    raw: json,
    text: extractResponseText(json)
  };
}

export function extractResponseText(response) {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  for (const output of response.output || []) {
    for (const content of output.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

async function safeReadError(response) {
  if (typeof response.text !== "function") {
    return "";
  }

  return response.text();
}

function redact(secret, value) {
  return value.replaceAll(secret, "[redacted]");
}
