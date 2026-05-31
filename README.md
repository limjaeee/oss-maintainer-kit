# oss-maintainer-kit

Codex-ready automation for small open-source maintainers.

`oss-maintainer-kit` turns pull request diffs, issue reports, and commit logs into structured maintainer prompts. The goal is to capture the tacit work maintainers already do: judging risk, spotting missing tests, asking for useful reproductions, and preparing releases without losing project judgment.

## Why this exists

Small open-source projects often depend on one or two maintainers. The hard part is not only writing code; it is repeatedly applying project-specific judgment to reviews, triage, compatibility, security, docs, and releases. This project gives that judgment a repeatable interface for Codex or other agent workflows.

## Install

```bash
npm install
npm test
```

Run from source:

```bash
node src/cli.js --help
```

## Usage

Review a pull request diff:

```bash
git diff origin/main...HEAD | node src/cli.js pr-review --repo owner/project
```

Render the GitHub Action PR comment body:

```bash
git diff origin/main...HEAD | node src/cli.js pr-comment --repo owner/project
```

Use repository-specific maintainer conventions:

```bash
git diff origin/main...HEAD | node src/cli.js pr-comment --repo owner/project --config .maintainer-kit.yml
```

Triage an issue body:

```bash
node src/cli.js issue-triage --issue issue.txt --repo owner/project
```

Draft release notes from commit messages:

```bash
git log --oneline --pretty=%s v0.1.0..HEAD | node src/cli.js release-notes --repo owner/project
```

Use `--json` when another agent or workflow should consume structured output.

Send a generated prompt to OpenAI explicitly:

```bash
node src/cli.js pr-review --diff pr.diff --repo owner/project > prompt.txt
OPENAI_API_KEY=sk-... node src/cli.js openai-response --input prompt.txt --model gpt-5
```

Normal review, comment, triage, and release commands do not call OpenAI. See [docs/openai-adapter.md](docs/openai-adapter.md).

## Maintainer workflows

- PR review: risk level, label suggestions, changed-file summary, review focus.
- PR comment mode: an opt-in GitHub Action comment that is updated instead of duplicated.
- Security-sensitive checklist: conservative signals for auth, dependencies, secrets, and permissions.
- Maintainer profile: optional `.maintainer-kit.yml` for critical paths, labels, compatibility policy, release branches, and review expectations.
- OpenAI adapter: explicit `openai-response` command for sending maintainer prompts to the Responses API.
- Issue triage: bug/feature/question classification, missing information, reply draft.
- Release notes: conventional commit grouping, migration-note prompt, follow-up checks.

## Examples

See [examples/README.md](examples/README.md) for sample pull request diffs, issue reports, release commit logs, and generated maintainer outputs.

## Codex for Open Source fit

This repository is designed around the work OpenAI describes for Codex for Open Source: PR review, maintainer automation, issue triage, and release workflows. The project can use API credits to run these workflows at scale across public repositories while preserving maintainer review as the final decision point.

See [docs/application-draft.md](docs/application-draft.md) for a ready-to-edit application draft and [CHANGELOG.md](CHANGELOG.md) for release history.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).

## License

MIT
