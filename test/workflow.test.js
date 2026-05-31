import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("Maintainer Kit workflow", () => {
  it("generates and upserts a PR review comment", async () => {
    const workflow = await readFile(".github/workflows/maintainer-kit.yml", "utf8");

    assert.match(workflow, /pull-requests: write/);
    assert.match(workflow, /node src\/cli\.js pr-comment/);
    assert.match(workflow, /pr-comment\.md/);
    assert.match(workflow, /actions\/github-script@v7/);
    assert.match(workflow, /oss-maintainer-kit:pr-review/);
    assert.match(workflow, /updateComment/);
    assert.match(workflow, /createComment/);
  });
});
