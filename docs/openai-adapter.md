# OpenAI Responses API adapter

`oss-maintainer-kit` includes an explicit opt-in adapter for the OpenAI Responses API.

The CLI never calls OpenAI during normal `pr-review`, `pr-comment`, `issue-triage`, or `release-notes` commands. A network request is made only when you run `openai-response` and provide `OPENAI_API_KEY`.

## Usage

Generate a maintainer prompt locally:

```bash
node src/cli.js pr-review --diff pr.diff --repo owner/project > prompt.txt
```

Send that prompt to the Responses API:

```bash
$env:OPENAI_API_KEY = "sk-..."
node src/cli.js openai-response --input prompt.txt --model gpt-5
```

On macOS or Linux:

```bash
export OPENAI_API_KEY="sk-..."
node src/cli.js openai-response --input prompt.txt --model gpt-5
```

## Safety

- No API request happens unless `openai-response` is invoked.
- `OPENAI_API_KEY` is required and is not logged by the adapter.
- API error messages redact the token if a provider error echoes it.
- Maintainers should review model output before posting comments, merging pull requests, or closing issues.

## Request shape

The adapter sends a minimal Responses API request:

```json
{
  "model": "gpt-5",
  "input": "..."
}
```
