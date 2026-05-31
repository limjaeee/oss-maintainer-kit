import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildResponsesPayload,
  extractResponseText,
  requestOpenAIResponse
} from "../src/openai.js";

describe("buildResponsesPayload", () => {
  it("builds a minimal Responses API payload", () => {
    assert.deepEqual(buildResponsesPayload({ input: "Review this PR." }), {
      model: "gpt-5",
      input: "Review this PR."
    });
  });

  it("preserves an explicit model", () => {
    assert.equal(
      buildResponsesPayload({ input: "Review this PR.", model: "gpt-5-mini" }).model,
      "gpt-5-mini"
    );
  });
});

describe("requestOpenAIResponse", () => {
  it("requires an API key before sending", async () => {
    let called = false;

    await assert.rejects(
      () =>
        requestOpenAIResponse({
          input: "Review this PR.",
          apiKey: "",
          fetchImpl: async () => {
            called = true;
          }
        }),
      /OPENAI_API_KEY/
    );

    assert.equal(called, false);
  });

  it("sends the expected request and extracts text", async () => {
    const response = await requestOpenAIResponse({
      input: "Review this PR.",
      apiKey: "test-key",
      fetchImpl: async (url, options) => {
        assert.equal(url, "https://api.openai.com/v1/responses");
        assert.equal(options.method, "POST");
        assert.equal(options.headers.Authorization, "Bearer test-key");
        assert.deepEqual(JSON.parse(options.body), {
          model: "gpt-5",
          input: "Review this PR."
        });

        return {
          ok: true,
          status: 200,
          json: async () => ({
            output_text: "Looks good."
          })
        };
      }
    });

    assert.equal(response.text, "Looks good.");
  });

  it("reports API errors without exposing the token", async () => {
    await assert.rejects(
      () =>
        requestOpenAIResponse({
          input: "Review this PR.",
          apiKey: "secret-token",
          fetchImpl: async () => ({
            ok: false,
            status: 429,
            text: async () => "rate limited for secret-token"
          })
        }),
      (error) => {
        assert.match(error.message, /OpenAI request failed with status 429/);
        assert.doesNotMatch(error.message, /secret-token/);
        return true;
      }
    );
  });
});

describe("extractResponseText", () => {
  it("handles output_text and structured output content", () => {
    assert.equal(extractResponseText({ output_text: "Direct text" }), "Direct text");
    assert.equal(
      extractResponseText({
        output: [
          {
            content: [{ type: "output_text", text: "Nested text" }]
          }
        ]
      }),
      "Nested text"
    );
  });
});
