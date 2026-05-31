#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { stdin, stdout, stderr, exit } from "node:process";

import { analyzeDiff, analyzeIssue, buildReleaseNotes } from "./analysis.js";
import { buildPrComment } from "./comments.js";
import { loadMaintainerConfig } from "./config.js";
import { requestOpenAIResponse } from "./openai.js";
import {
  buildIssueTriagePrompt,
  buildPrReviewPrompt,
  buildReleasePrompt
} from "./prompts.js";

const USAGE = `oss-maintainer-kit

Usage:
  oss-maintainer-kit pr-review --diff <file> [--repo owner/name] [--json]
  oss-maintainer-kit pr-comment --diff <file> [--repo owner/name] [--config .maintainer-kit.yml]
  oss-maintainer-kit issue-triage --issue <file> [--repo owner/name] [--json]
  oss-maintainer-kit release-notes --log <file> [--repo owner/name] [--json]
  oss-maintainer-kit openai-response --input <file> [--model gpt-5]

If a file option is omitted, input is read from stdin.
`;

async function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    stdout.write(USAGE);
    return;
  }

  const [command, ...rest] = argv;
  const options = parseOptions(rest);

  if (!command) {
    stdout.write(USAGE);
    return;
  }

  if (command === "pr-review") {
    const diff = await readInput(options.diff);
    const config = await loadMaintainerConfig(options.config);
    const analysis = analyzeDiff(diff, config);
    return writeResult({
      json: options.json,
      payload: { command, analysis },
      text: buildPrReviewPrompt({ repository: options.repo, analysis })
    });
  }

  if (command === "pr-comment") {
    const diff = await readInput(options.diff);
    const config = await loadMaintainerConfig(options.config);
    const analysis = analyzeDiff(diff, config);
    return writeResult({
      json: false,
      payload: { command, analysis },
      text: buildPrComment({ repository: options.repo, analysis })
    });
  }

  if (command === "issue-triage") {
    const issue = await readInput(options.issue);
    const analysis = analyzeIssue(issue);
    return writeResult({
      json: options.json,
      payload: { command, analysis },
      text: buildIssueTriagePrompt({ repository: options.repo, analysis })
    });
  }

  if (command === "release-notes") {
    const log = await readInput(options.log);
    const notes = buildReleaseNotes(log);
    return writeResult({
      json: options.json,
      payload: { command, notes },
      text: buildReleasePrompt({ repository: options.repo, notes })
    });
  }

  if (command === "openai-response") {
    const input = await readInput(options.input);
    const response = await requestOpenAIResponse({
      input,
      model: options.model,
      apiKey: process.env.OPENAI_API_KEY
    });
    stdout.write(`${response.text}\n`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function parseOptions(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      options[key] = value;
      index += 1;
    }
  }

  return options;
}

async function readInput(filePath) {
  if (filePath) {
    return readFile(filePath, "utf8");
  }

  const chunks = [];
  for await (const chunk of stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function writeResult({ json, payload, text }) {
  stdout.write(json ? `${JSON.stringify(payload, null, 2)}\n` : `${text}\n`);
}

main(process.argv.slice(2)).catch((error) => {
  stderr.write(`${error.message}\n`);
  exit(1);
});
