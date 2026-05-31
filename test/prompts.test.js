import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildIssueTriagePrompt,
  buildPrReviewPrompt,
  buildReleasePrompt
} from "../src/prompts.js";

describe("prompt builders", () => {
  it("builds a PR review prompt with maintainer judgement fields", () => {
    const prompt = buildPrReviewPrompt({
      repository: "owner/project",
      analysis: {
        riskLevel: "medium",
        files: [{ path: "src/cli.js", additions: 10, deletions: 2, hunks: 1 }],
        reviewFocus: ["Check CLI argument compatibility."],
        recommendedLabels: ["needs-tests"]
      }
    });

    assert.match(prompt, /owner\/project/);
    assert.match(prompt, /Risk level: medium/);
    assert.match(prompt, /tacit maintainer judgment/i);
  });

  it("uses fallbacks when optional PR fields are absent", () => {
    const prompt = buildPrReviewPrompt({
      analysis: {
        riskLevel: "low",
        files: [],
        reviewFocus: [],
        recommendedLabels: []
      }
    });

    assert.match(prompt, /Repository: unknown/);
    assert.match(prompt, /Recommended labels: none/);
  });

  it("builds issue and release prompts with concrete next actions", () => {
    const issuePrompt = buildIssueTriagePrompt({
      repository: "owner/project",
      analysis: {
        type: "bug",
        suggestedLabels: ["bug"],
        maintainerReply: "Please share a minimal reproduction."
      }
    });
    const releasePrompt = buildReleasePrompt({
      repository: "owner/project",
      notes: { sections: { Features: ["add triage"], Fixes: [] } }
    });

    assert.match(issuePrompt, /Suggested labels: bug/);
    assert.match(issuePrompt, /next maintainer action/i);
    assert.match(releasePrompt, /Features/);
    assert.match(releasePrompt, /migration notes/i);
  });
});
