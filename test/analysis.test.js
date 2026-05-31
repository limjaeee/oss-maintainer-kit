import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  analyzeDiff,
  analyzeIssue,
  buildReleaseNotes,
  parseUnifiedDiff
} from "../src/analysis.js";

describe("parseUnifiedDiff", () => {
  it("returns no files for empty diffs", () => {
    assert.deepEqual(parseUnifiedDiff(""), []);
  });

  it("extracts file paths and line counts from a unified diff", () => {
    const diff = [
      "diff --git a/src/auth.js b/src/auth.js",
      "index 1111111..2222222 100644",
      "--- a/src/auth.js",
      "+++ b/src/auth.js",
      "@@ -1,2 +1,3 @@",
      " const enabled = true;",
      "+const role = 'admin';",
      "-const old = true;",
      "diff --git a/docs/readme.md b/docs/readme.md",
      "--- a/docs/readme.md",
      "+++ b/docs/readme.md",
      "@@ -1 +1 @@",
      "+Updated docs"
    ].join("\n");

    assert.deepEqual(parseUnifiedDiff(diff), [
      {
        path: "src/auth.js",
        additions: 1,
        deletions: 1,
        hunks: 1
      },
      {
        path: "docs/readme.md",
        additions: 1,
        deletions: 0,
        hunks: 1
      }
    ]);
  });
});

describe("analyzeDiff", () => {
  it("marks security-sensitive source changes as high risk", () => {
    const diff = [
      "diff --git a/src/auth/session.js b/src/auth/session.js",
      "--- a/src/auth/session.js",
      "+++ b/src/auth/session.js",
      "@@ -1 +1 @@",
      "-allowAllUsers();",
      "+allowSignedUsers();"
    ].join("\n");

    const result = analyzeDiff(diff);

    assert.equal(result.riskLevel, "high");
    assert.deepEqual(result.recommendedLabels, ["security", "needs-tests"]);
    assert.match(result.reviewFocus[0], /security-sensitive/i);
    assert.deepEqual(result.securitySignals.map((signal) => signal.type), [
      "authentication"
    ]);
    assert.match(result.securityChecklist[0], /verify authorization/i);
  });

  it("detects dependency lockfile and secret handling signals", () => {
    const diff = [
      "diff --git a/package-lock.json b/package-lock.json",
      "--- a/package-lock.json",
      "+++ b/package-lock.json",
      "@@ -1 +1 @@",
      "+{\"name\":\"changed\"}",
      "diff --git a/src/config.js b/src/config.js",
      "--- a/src/config.js",
      "+++ b/src/config.js",
      "@@ -1 +1 @@",
      "+export const apiKey = process.env.OPENAI_API_KEY;"
    ].join("\n");

    const result = analyzeDiff(diff);

    assert.equal(result.riskLevel, "high");
    assert.deepEqual(result.securitySignals.map((signal) => signal.type), [
      "dependency",
      "secret-handling"
    ]);
    assert.ok(result.securityChecklist.some((item) => /supply chain/i.test(item)));
    assert.ok(result.securityChecklist.some((item) => /secret/i.test(item)));
  });

  it("treats docs-only diffs as low risk", () => {
    const diff = [
      "diff --git a/docs/usage.md b/docs/usage.md",
      "--- a/docs/usage.md",
      "+++ b/docs/usage.md",
      "@@ -1 +1 @@",
      "+Better setup notes"
    ].join("\n");

    const result = analyzeDiff(diff);

    assert.equal(result.riskLevel, "low");
    assert.deepEqual(result.recommendedLabels, ["documentation"]);
    assert.equal(result.filesChanged, 1);
    assert.deepEqual(result.securitySignals, []);
    assert.deepEqual(result.securityChecklist, []);
  });
});

describe("analyzeIssue", () => {
  it("asks for details on empty issues", () => {
    const result = analyzeIssue("");

    assert.equal(result.type, "support");
    assert.deepEqual(result.suggestedLabels, ["needs-info"]);
  });

  it("classifies crash reports as bugs with reproduction focus", () => {
    const result = analyzeIssue(
      "The CLI crashes with TypeError when I run release-notes on Windows."
    );

    assert.equal(result.type, "bug");
    assert.ok(result.suggestedLabels.includes("bug"));
    assert.match(result.maintainerReply, /minimal reproduction/i);
  });

  it("classifies unclear issues as questions", () => {
    const result = analyzeIssue("How should I configure this for private repos?");

    assert.equal(result.type, "question");
    assert.deepEqual(result.suggestedLabels, ["question"]);
  });
});

describe("buildReleaseNotes", () => {
  it("groups conventional commit messages into release sections", () => {
    const notes = buildReleaseNotes(
      [
        "feat: add PR review prompt builder",
        "fix: handle empty issue body",
        "docs: document GitHub Action usage"
      ].join("\n")
    );

    assert.deepEqual(notes.sections.Features, ["add PR review prompt builder"]);
    assert.deepEqual(notes.sections.Fixes, ["handle empty issue body"]);
    assert.deepEqual(notes.sections.Documentation, [
      "document GitHub Action usage"
    ]);
  });

  it("puts non-conventional commits into maintenance", () => {
    const notes = buildReleaseNotes("- Update dependencies");

    assert.deepEqual(notes.sections.Maintenance, ["Update dependencies"]);
  });
});
