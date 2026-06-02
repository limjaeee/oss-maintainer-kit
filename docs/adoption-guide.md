# Adoption guide

This guide is for maintainers who want to try `oss-maintainer-kit` in another public repository.

The tool is designed to assist maintainer judgment. It should not auto-merge pull requests, auto-close issues, or replace project-specific review decisions.

## 1. Try it locally first

Clone the target repository and run the CLI against a pull request diff:

```bash
git diff origin/main...HEAD > pr.diff
node path/to/oss-maintainer-kit/src/cli.js pr-comment --diff pr.diff --repo owner/project
```

Read the generated output as a review checklist. Check whether the risk level, labels, changed files, and review focus match your own maintainer judgment.

## 2. Add a maintainer profile

Create `.maintainer-kit.yml` in the target repository:

```yaml
criticalPaths:
  - src/**
  - .github/workflows/**
preferredLabels:
  critical: critical-path
  security: security
  tests: needs-tests
compatibilityPolicy: Keep public APIs and CLI behavior backward compatible unless release notes call out a breaking change.
releaseBranches:
  - main
reviewExpectations:
  - Prefer focused pull requests with tests for new behavior.
  - Make uncertainty explicit when security-sensitive paths change.
```

Then run:

```bash
node path/to/oss-maintainer-kit/src/cli.js pr-comment --diff pr.diff --repo owner/project --config .maintainer-kit.yml
```

## 3. Review the output before publishing

Maintainers should check:

- Whether configured critical paths are accurate.
- Whether security checklist items are relevant or over-broad.
- Whether missing-test warnings match the project's actual test layout.
- Whether compatibility notes reflect the project's release policy.
- Whether generated text is concise enough for a pull request comment.

Treat security signals as prompts for review, not confirmed vulnerabilities.

## 4. Enable the GitHub Action

Copy `.github/workflows/maintainer-kit.yml` into the target repository after local testing.

The workflow:

- Uses read access for contents.
- Uses write access only to create or update one pull request comment.
- Updates an existing `oss-maintainer-kit` comment instead of creating duplicates.
- Applies `.maintainer-kit.yml` automatically when present.

## 5. Keep a maintainer in the loop

Recommended rollout:

1. Run locally on 2-3 recent pull requests.
2. Adjust `.maintainer-kit.yml`.
3. Enable the Action on a low-risk repository.
4. Ask maintainers whether the comments are useful, too noisy, or missing project-specific risks.
5. Update the profile before expanding usage.

## 6. Optional OpenAI adapter

The OpenAI adapter is explicit opt-in:

```bash
OPENAI_API_KEY=sk-... node path/to/oss-maintainer-kit/src/cli.js openai-response --input prompt.txt --model gpt-5
```

Normal `pr-review`, `pr-comment`, `issue-triage`, and `release-notes` commands do not call OpenAI.

Use the adapter only when maintainers have reviewed what data is being sent and are comfortable with the repository's privacy and security constraints.
