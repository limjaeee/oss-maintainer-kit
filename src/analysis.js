const DOC_PATTERN = /(^docs\/|\.md$|\.mdx$|\.rst$|\.adoc$|^readme|^license|^changelog)/i;
const TEST_PATTERN = /(^test\/|^tests\/|\.test\.|\.spec\.|__tests__)/i;
const SECURITY_PATTERN = /(auth|security|session|token|permission|crypto|password|secret|oauth|jwt|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)/i;

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
  const docsOnly = files.length > 0 && files.every((file) => DOC_PATTERN.test(file.path));
  const touchesTests = files.some((file) => TEST_PATTERN.test(file.path));
  const touchesSecurity = files.some((file) => SECURITY_PATTERN.test(file.path));
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
    files
  };
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
