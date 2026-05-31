# Examples

These examples show how maintainers should review `oss-maintainer-kit` output before acting on it.

The tool does not merge pull requests, close issues, or publish releases. It gives maintainers a structured starting point: risk signals, labels, missing information, and prompts that can be passed to Codex or another review assistant.

## PR review

Input:

```bash
node src/cli.js pr-review --diff examples/pr-review/auth-change.diff --repo limjaeee/oss-maintainer-kit
```

Output:

- Risk level: high
- Labels: `security`, `needs-tests`
- Maintainer review focus: authentication, authorization, secrets, dependency impact, and missing test coverage.

Maintainer action:

Read the changed auth path, verify whether tests cover the behavior, and ask for a focused security review before merging.

## Issue triage

Input:

```bash
node src/cli.js issue-triage --issue examples/issue-triage/windows-crash.txt --repo limjaeee/oss-maintainer-kit
```

Output:

- Type: bug
- Labels: `bug`, `needs-reproduction`
- Maintainer reply: asks for a minimal reproduction, command, expected behavior, actual behavior, and environment.

Maintainer action:

Do not debug from a vague report. Ask for a reproduction that preserves the user context and the command that failed.

## Release notes

Input:

```bash
node src/cli.js release-notes --log examples/release-notes/commits.txt --repo limjaeee/oss-maintainer-kit
```

Output:

- Features, fixes, documentation, and maintenance sections.
- Prompt instructions to include migration notes and follow-up checks.

Maintainer action:

Compare generated sections against the actual merged pull requests, then add any compatibility or upgrade notes the commit messages did not capture.
