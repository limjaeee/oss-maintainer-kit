# Changelog

## 0.2.0 - 2026-05-31

### Added

- GitHub Action PR comment mode with comment upsert behavior.
- Real maintainer workflow examples for PR review, issue triage, and release notes.
- Security-sensitive review checklist for authentication, dependencies, secrets, and permissions.
- `.maintainer-kit.yml` project profile for critical paths, labels, compatibility policy, release branches, and review expectations.
- Explicit opt-in OpenAI Responses API adapter through `openai-response`.

### Changed

- PR review prompts and comments now include security checklist items when relevant.
- The GitHub Action automatically applies `.maintainer-kit.yml` when present.

### Safety

- Normal local commands do not call OpenAI.
- OpenAI requests require `OPENAI_API_KEY` and redact provider errors that echo the token.

## 0.1.0 - 2026-05-31

### Added

- Initial CLI for PR review prompts, issue triage, and release note drafting.
- Tested diff analysis, prompt generation, documentation, and GitHub Action scaffold.
