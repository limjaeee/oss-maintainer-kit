# Security-sensitive change checklist

`oss-maintainer-kit` treats security signals as prompts for maintainer review, not as confirmed vulnerabilities. The goal is to make tacit maintainer judgment explicit enough that reviewers know where to focus.

## Signals

- Authentication: auth, session, OAuth, JWT, login, and password paths or content.
- Dependencies: package manifests and lockfiles.
- Secret handling: secrets, tokens, credentials, config, environment variables, and API keys.
- Permissions: roles, policies, workflow permissions, token scopes, and write access.

## Review expectations

- Verify authorization boundaries and possible bypass paths.
- Check session lifecycle and compatibility with existing login flows.
- Review supply chain impact for dependency changes.
- Confirm secrets are not committed, logged, exposed in errors, or made available to untrusted pull request code.
- Check least-privilege permissions for workflows and token scopes.

## Uncertainty

The checklist is intentionally conservative. A signal means “review this carefully,” not “this change is unsafe.” Maintainers should combine these signals with project context, tests, threat model, and release risk.
