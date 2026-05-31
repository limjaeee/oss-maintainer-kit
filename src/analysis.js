const DOC_PATTERN = /(^docs\/|\.md$|\.mdx$|\.rst$|\.adoc$|^readme|^license|^changelog)/i;
const TEST_PATTERN = /(^test\/|^tests\/|\.test\.|\.spec\.|__tests__)/i;
const SECURITY_PATTERN = /(auth|security|session|token|permission|crypto|password|secret|oauth|jwt|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)/i;

const SECURITY_SIGNAL_RULES = [
  {
    type: "authentication",
    pathPattern: /(auth|session|oauth|jwt|login|password)/i,
    contentPattern: /(allow|role|session|token|password|oauth|jwt|login)/i,
    checklist:
      "Verify authorization boundaries, authentication bypass risk, session lifecycle, and compatibility with existing login flows."
  },
  {
    type: "dependency",
    pathPattern: /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|package\.json)$/i,
    contentPattern: /(version|resolved|integrity|dependencies|devDependencies)/i,
    checklist:
      "Review supply chain impact: package source, version jump, transitive dependencies, and lockfile consistency."
  },
  {
    type: "secret-handling",
    pathPattern: /(secret|token|credential|config|env)/i,
    contentPattern: /(secret|token|api[_-]?key|password|credential|process\.env)/i,
    checklist:
      "Confirm no secrets are committed, logged, exposed in errors, or made available to untrusted pull request code."
  },
  {
    type: "permission",
    pathPattern: /(permission|role|policy|workflow|\.github\/workflows)/i,
    contentPattern: /(permission|permissions|write|admin|role|scope|token)/i,
    checklist:
      "Check least-privilege permissions, token scopes, workflow trigger safety, and write access boundaries."
  }
];

export function parseUnifiedDiff(diffText) {
  if (!diffText?.trim()) {
    return [];
  }

  const files = [];
  let currentFile = null;

  for (const line of diffText.split(/\r?\n/)) {
    const fileMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (fileMatch) {
      currentFile = {
        path: fileMatch[2],
        additions: 0,
        deletions: 0,
        hunks: 0
      };
      files.push(currentFile);
      continue;
    }

    if (!currentFile) {
      continue;
    }

    if (line.startsWith("@@")) {
      currentFile.hunks += 1;
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      currentFile.additions += 1;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      currentFile.deletions += 1;
    }
  }

  return files;
}

export function analyzeDiff(diffText) {
  const files = parseUnifiedDiff(diffText);
  const securitySignals = detectSecuritySignals(diffText, files);
  const docsOnly = files.length > 0 && files.every((file) => DOC_PATTERN.test(file.path));
  const touchesTests = files.some((file) => TEST_PATTERN.test(file.path));
  const touchesSecurity =
    files.some((file) => SECURITY_PATTERN.test(file.path)) || securitySignals.length > 0;
  const touchesSource = files.some(
    (file) => !DOC_PATTERN.test(file.path) && !TEST_PATTERN.test(file.path)
  );

  const recommendedLabels = new Set();
  const reviewFocus = [];
  let riskLevel = "low";

  if (docsOnly) {
    recommendedLabels.add("documentation");
    reviewFocus.push("Check that documentation matches current behavior and install steps.");
  } else if (touchesSecurity) {
    riskLevel = "high";
    recommendedLabels.add("security");
    reviewFocus.push(
      "Security-sensitive paths changed; review authentication, authorization, secrets, and dependency impact."
    );
  } else if (touchesSource) {
    riskLevel = "medium";
    reviewFocus.push("Check user-visible behavior, backward compatibility, and failure handling.");
  }

  if (touchesSource && !touchesTests) {
    recommendedLabels.add("needs-tests");
    reviewFocus.push("No test files changed; ask whether existing coverage exercises this path.");
  }

  return {
    filesChanged: files.length,
    totalAdditions: files.reduce((sum, file) => sum + file.additions, 0),
    totalDeletions: files.reduce((sum, file) => sum + file.deletions, 0),
    riskLevel,
    recommendedLabels: [...recommendedLabels],
    reviewFocus,
    securitySignals,
    securityChecklist: securitySignals.map((signal) => signal.checklist),
    files
  };
}

function detectSecuritySignals(diffText, files) {
  const addedOrRemovedLinesByPath = collectChangedLines(diffText);
  const signals = [];
  const seenTypes = new Set();

  for (const file of files) {
    const changedText = (addedOrRemovedLinesByPath.get(file.path) || []).join("\n");
    for (const rule of SECURITY_SIGNAL_RULES) {
      if (seenTypes.has(rule.type)) {
        continue;
      }

      if (rule.pathPattern.test(file.path) || rule.contentPattern.test(changedText)) {
        signals.push({ type: rule.type, path: file.path, checklist: rule.checklist });
        seenTypes.add(rule.type);
      }
    }
  }

  return signals;
}

function collectChangedLines(diffText) {
  const byPath = new Map();
  let currentPath = null;

  for (const line of diffText.split(/\r?\n/)) {
    const fileMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (fileMatch) {
      currentPath = fileMatch[2];
      byPath.set(currentPath, []);
      continue;
    }

    if (
      currentPath &&
      (line.startsWith("+") || line.startsWith("-")) &&
      !line.startsWith("+++") &&
      !line.startsWith("---")
    ) {
      byPath.get(currentPath).push(line.slice(1));
    }
  }

  return byPath;
}

export function analyzeIssue(issueText) {
  const text = issueText.trim();
  const lowerText = text.toLowerCase();

  if (!text) {
    return {
      type: "support",
      suggestedLabels: ["needs-info"],
      maintainerReply: "Please add the expected behavior, actual behavior, and environment details."
    };
  }

  if (/(crash|error|exception|traceback|typeerror|bug|broken|fails?)/i.test(lowerText)) {
    return {
      type: "bug",
      suggestedLabels: ["bug", "needs-reproduction"],
      maintainerReply:
        "Thanks for the report. Please share a minimal reproduction, the exact command, expected behavior, actual behavior, and your environment."
    };
  }

  if (/(feature|request|support|add|could you|would be nice)/i.test(lowerText)) {
    return {
      type: "feature",
      suggestedLabels: ["enhancement", "needs-design"],
      maintainerReply:
        "Thanks for the idea. Please describe the maintainer workflow this improves, the tradeoffs, and a concrete example."
    };
  }

  return {
    type: "question",
    suggestedLabels: ["question"],
    maintainerReply:
      "Thanks for opening this. Please clarify the goal, what you tried, and which part of the maintainer workflow is blocked."
  };
}

export function buildReleaseNotes(commitLog) {
  const sections = {
    Features: [],
    Fixes: [],
    Documentation: [],
    Maintenance: []
  };

  for (const rawLine of commitLog.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^[-*]\s+/, "");
    if (!line) {
      continue;
    }

    const match = line.match(/^(feat|fix|docs|chore|refactor|test)(?:\(.+\))?:\s*(.+)$/i);
    if (!match) {
      sections.Maintenance.push(line);
      continue;
    }

    const [, type, description] = match;
    const key =
      type.toLowerCase() === "feat"
        ? "Features"
        : type.toLowerCase() === "fix"
          ? "Fixes"
          : type.toLowerCase() === "docs"
            ? "Documentation"
            : "Maintenance";

    sections[key].push(description);
  }

  return { sections };
}
