import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPrComment, COMMENT_MARKER } from "../src/comments.js";

describe("buildPrComment", () => {
  it("formats a stable PR review comment for GitHub Actions", () => {
    const comment = buildPrComment({
      repository: "limjaeee/oss-maintainer-kit",
      analysis: {
        riskLevel: "high",
        filesChanged: 1,
        totalAdditions: 3,
        totalDeletions: 2,
        recommendedLabels: ["security", "needs-tests"],
        reviewFocus: [
          "Security-sensitive paths changed; review authentication impact.",
          "No test files changed; ask whether existing coverage exercises this path."
        ],
        files: [
          {
            path: "src/auth/session.js",
            additions: 3,
            deletions: 2,
            hunks: 1
          }
        ]
      }
    });

    assert.match(comment, new RegExp(COMMENT_MARKER));
    assert.match(comment, /Repository: `limjaeee\/oss-maintainer-kit`/);
    assert.match(comment, /Risk: \*\*high\*\*/);
    assert.match(comment, /Labels: `security`, `needs-tests`/);
    assert.match(comment, /src\/auth\/session\.js \(\+3\/-2, 1 hunks\)/);
    assert.match(comment, /Maintainer note/);
  });

  it("uses explicit no-label and no-file fallbacks", () => {
    const comment = buildPrComment({
      analysis: {
        riskLevel: "low",
        filesChanged: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        recommendedLabels: [],
        reviewFocus: [],
        files: []
      }
    });

    assert.match(comment, /Repository: `unknown`/);
    assert.match(comment, /Labels: none/);
    assert.match(comment, /No changed files detected/);
  });
});
