import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseMaintainerConfig, validateMaintainerConfig } from "../src/config.js";

describe("parseMaintainerConfig", () => {
  it("parses the supported .maintainer-kit.yml profile fields", () => {
    const config = parseMaintainerConfig(`
criticalPaths:
  - src/analysis.js
  - .github/workflows/**
preferredLabels:
  security: security
  tests: needs-tests
compatibilityPolicy: Keep CLI output backward compatible unless the release notes call out a breaking change.
releaseBranches:
  - main
reviewExpectations:
  - Prefer focused PRs with tests.
  - Call out security uncertainty clearly.
`);

    assert.deepEqual(config.criticalPaths, ["src/analysis.js", ".github/workflows/**"]);
    assert.deepEqual(config.preferredLabels, {
      security: "security",
      tests: "needs-tests"
    });
    assert.equal(config.releaseBranches[0], "main");
    assert.equal(config.reviewExpectations.length, 2);
  });

  it("rejects unsupported top-level fields", () => {
    assert.throws(
      () => parseMaintainerConfig("unknownField:\n  - value\n"),
      /Unsupported config field/
    );
  });
});

describe("validateMaintainerConfig", () => {
  it("rejects non-array critical paths", () => {
    assert.throws(
      () => validateMaintainerConfig({ criticalPaths: "src/**" }),
      /criticalPaths must be a list/
    );
  });
});
