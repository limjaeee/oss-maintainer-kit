export function buildPrReviewPrompt({ repository, analysis }) {
  return [
    `Repository: ${repository || "unknown"}`,
    `Risk level: ${analysis.riskLevel}`,
    `Files changed: ${analysis.filesChanged ?? analysis.files?.length ?? 0}`,
    "",
    "Use tacit maintainer judgment: infer project conventions, compatibility risks, and release impact from the concrete changes below.",
    "",
    "Review focus:",
    ...asBullets(analysis.reviewFocus),
    "",
    `Recommended labels: ${analysis.recommendedLabels.join(", ") || "none"}`,
    "",
    "Changed files:",
    ...asBullets(
      analysis.files.map(
        (file) => `${file.path} (+${file.additions}/-${file.deletions}, ${file.hunks} hunks)`
      )
    ),
    "",
    "Return: risk summary, blocking concerns, missing tests, compatibility notes, and a maintainer-ready PR comment."
  ].join("\n");
}

export function buildIssueTriagePrompt({ repository, analysis }) {
  return [
    `Repository: ${repository || "unknown"}`,
    `Issue type: ${analysis.type}`,
    `Suggested labels: ${analysis.suggestedLabels.join(", ") || "none"}`,
    "",
    "Infer the next maintainer action from the issue, but avoid pretending uncertain facts are known.",
    "",
    `Draft maintainer reply: ${analysis.maintainerReply}`,
    "",
    "Return: classification, missing information, suggested label set, and the next maintainer action."
  ].join("\n");
}

export function buildReleasePrompt({ repository, notes }) {
  return [
    `Repository: ${repository || "unknown"}`,
    "",
    "Draft release notes from these grouped commits. Include migration notes, breaking-change checks, and maintainer follow-up items.",
    "",
    ...Object.entries(notes.sections).flatMap(([section, items]) => [
      `${section}:`,
      ...asBullets(items.length ? items : ["No entries."]),
      ""
    ])
  ].join("\n");
}

function asBullets(items) {
  return items.map((item) => `- ${item}`);
}
