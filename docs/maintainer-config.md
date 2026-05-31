# Maintainer profile

`oss-maintainer-kit` can read a small project profile from `.maintainer-kit.yml`.

The profile captures project-specific maintainer judgment: critical paths, labels, compatibility expectations, release branches, and review norms. This lets the CLI make repository-local review prompts without pretending those conventions are universal.

## Example

```yaml
criticalPaths:
  - src/**
  - .github/workflows/**
preferredLabels:
  critical: critical-path
  security: security
  tests: needs-tests
compatibilityPolicy: Keep CLI commands and JSON fields backward compatible unless release notes call out a breaking change.
releaseBranches:
  - main
reviewExpectations:
  - Prefer focused pull requests with tests for new behavior.
  - Make uncertainty explicit when security-sensitive paths change.
```

## Usage

```bash
node src/cli.js pr-comment --diff pr.diff --repo owner/project --config .maintainer-kit.yml
```

The GitHub Action automatically passes `--config .maintainer-kit.yml` when the file exists.

## Supported fields

- `criticalPaths`: list of exact paths, `*` patterns, or directory `/**` patterns.
- `preferredLabels`: map of logical labels to repository labels.
- `compatibilityPolicy`: one-line compatibility expectation.
- `releaseBranches`: list of release branches for future release workflows.
- `reviewExpectations`: list of project-specific review norms.

Unsupported fields fail fast so config mistakes do not silently change review behavior.
