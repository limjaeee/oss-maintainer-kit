import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { analyzeDiff } from "../src/analysis.js";

describe("analyzeDiff with maintainer config", () => {
  it("marks configured critical paths and adds project review expectations", () => {
    const diff = [
      "diff --git a/src/analysis.js b/src/analysis.js",
      "--- a/src/analysis.js",
      "+++ b/src/analysis.js",
      "@@ -1 +1 @@",
      "+export const ready = true;"
    ].join("\n");

    const result = analyzeDiff(diff, {
      criticalPaths: ["src/analysis.js"],
      preferredLabels: { critical: "critical-path" },
      compatibilityPolicy: "Keep CLI output backward compatible.",
      reviewExpectations: ["Prefer focused PRs with tests."]
    });

    assert.equal(result.riskLevel, "high");
    assert.ok(result.recommendedLabels.includes("critical-path"));
    assert.ok(result.reviewFocus.some((item) => /Configured critical path/i.test(item)));
    assert.ok(result.reviewFocus.some((item) => /Keep CLI output backward compatible/i.test(item)));
    assert.ok(result.reviewFocus.some((item) => /Prefer focused PRs/i.test(item)));
  });
});
