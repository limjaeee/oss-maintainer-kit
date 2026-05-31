import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("cli", () => {
  it("prints help when called with --help", () => {
    const result = spawnSync(process.execPath, ["src/cli.js", "--help"], {
      encoding: "utf8"
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /oss-maintainer-kit/);
    assert.equal(result.stderr, "");
  });

  it("reads issue triage input from stdin", () => {
    const result = spawnSync(
      process.execPath,
      ["src/cli.js", "issue-triage", "--repo", "owner/project", "--json"],
      {
        encoding: "utf8",
        input: "Feature request: add GitHub Action comments."
      }
    );

    const payload = JSON.parse(result.stdout);

    assert.equal(result.status, 0);
    assert.equal(payload.command, "issue-triage");
    assert.equal(payload.analysis.type, "feature");
  });

  it("analyzes PR review diffs from a file", () => {
    const dir = mkdtempSync(join(tmpdir(), "maintainer-kit-"));
    const diffPath = join(dir, "change.diff");
    writeFileSync(
      diffPath,
      [
        "diff --git a/src/index.js b/src/index.js",
        "--- a/src/index.js",
        "+++ b/src/index.js",
        "@@ -1 +1 @@",
        "+export const ready = true;"
      ].join("\n")
    );

    const result = spawnSync(
      process.execPath,
      ["src/cli.js", "pr-review", "--diff", diffPath, "--json"],
      { encoding: "utf8" }
    );
    const payload = JSON.parse(result.stdout);

    assert.equal(result.status, 0);
    assert.equal(payload.command, "pr-review");
    assert.equal(payload.analysis.riskLevel, "medium");
  });

  it("builds release notes from a log file", () => {
    const dir = mkdtempSync(join(tmpdir(), "maintainer-kit-"));
    const logPath = join(dir, "commits.txt");
    writeFileSync(logPath, "fix: repair release parser\n");

    const result = spawnSync(
      process.execPath,
      ["src/cli.js", "release-notes", "--log", logPath],
      { encoding: "utf8" }
    );

    assert.equal(result.status, 0);
    assert.match(result.stdout, /repair release parser/);
  });

  it("reports missing option values", () => {
    const result = spawnSync(process.execPath, ["src/cli.js", "pr-review", "--diff"], {
      encoding: "utf8"
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Missing value for --diff/);
  });

  it("reports unknown commands", () => {
    const result = spawnSync(process.execPath, ["src/cli.js", "unknown"], {
      encoding: "utf8"
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unknown command/);
  });
});
