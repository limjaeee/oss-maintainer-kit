# Maintainer health check

This checklist is for routine maintenance of `oss-maintainer-kit`.

The goal is to leave useful public maintenance evidence without creating noise. A good maintenance cycle should clarify project state, improve adoption, reduce risk, or make maintainer judgment easier to audit.

## Weekly checks

Run these checks once or twice per week:

- Review open issues and pull requests.
- Check the latest GitHub Action runs.
- Run `npm test` locally before making changes.
- Review whether examples still match CLI behavior.
- Check whether `.maintainer-kit.yml` still reflects current critical paths.
- Review recent changes for security-sensitive paths, token handling, workflow permissions, and dependency updates.

## Useful maintenance actions

Good lightweight actions include:

- Add or improve a real usage example.
- Clarify setup steps that a maintainer would need in another repository.
- Update docs when CLI behavior changes.
- Add a focused regression test for a behavior that could drift.
- Improve release notes or adoption guidance.
- Open an issue that captures a real limitation or next milestone.

## When not to change anything

Do not make a commit only to show activity.

Skip a maintenance change when:

- There are no open issues or broken checks.
- The proposed edit does not help users or maintainers.
- The change would create noisy generated content.
- The change would overstate project usage, adoption, or security coverage.

It is acceptable for the repository to be quiet when the current state is healthy.

## Release cadence

Use patch releases for small documentation, examples, or workflow fixes only when they help downstream users.

Use minor releases when the project adds a new maintainer workflow, CLI command, configuration capability, or adapter.

Avoid releases for trivial wording-only changes unless the wording fixes a real adoption or safety issue.

## Review stance

Generated review comments and security checklist items should be treated as prompts for maintainer judgment, not final decisions.

Maintainers should keep these boundaries visible:

- The tool should not auto-merge pull requests.
- The tool should not auto-close issues.
- Security signals are conservative review prompts, not confirmed vulnerabilities.
- OpenAI usage is explicit opt-in through `openai-response`.
