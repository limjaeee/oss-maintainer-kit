import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { spawnSync } from "node:child_process";

describe("examples", () => {
  it("keeps the PR review prompt example in sync", async () => {
    const result = spawnSync(
      process.execPath,
      [
        "src/cli.js",
        "pr-review",
        "--diff",
        "examples/pr-review/auth-change.diff",
        "--repo",
        "limjaeee/oss-maintainer-kit"
      ],
      { encoding: "utf8" }
    );
    const expected = await readFile("examples/pr-review/auth-change.prompt.txt", "utf8");

    assert.equal(result.status, 0);
    assert.equal(normalize(result.stdout), normalize(expected));
  });

  it("keeps the issue triage JSON example in sync", async () => {
    const result = spawnSync(
      process.execPath,
      [
        "src/cli.js",
        "issue-triage",
        "--issue",
        "examples/issue-triage/windows-crash.txt",
        "--json"
      ],
      { encoding: "utf8" }
    );
    const expected = await readFile("examples/issue-triage/windows-crash.json", "utf8");

    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), JSON.parse(expected));
  });

  it("keeps the release notes prompt example in sync", async () => {
    const result = spawnSync(
      process.execPath,
      [
        "src/cli.js",
        "release-notes",
        "--log",
        "examples/release-notes/commits.txt",
        "--repo",
        "limjaeee/oss-maintainer-kit"
      ],
      { encoding: "utf8" }
    );
    const expected = await readFile("examples/release-notes/commits.prompt.txt", "utf8");

    assert.equal(result.status, 0);
    assert.equal(normalize(result.stdout), normalize(expected));
  });
});

function normalize(value) {
  return value.trim().replace(/\r\n/g, "\n");
}
