export const COMMENT_MARKER = "<!-- oss-maintainer-kit:pr-review -->";

export function buildPrComment({ repository, analysis }) {
  const labels = analysis.recommendedLabels.length
    ? analysis.recommendedLabels.map((label) => `\`${label}\``).join(", ")
    : "none";
  const focusItems = analysis.reviewFocus.length
    ? analysis.reviewFocus
    : ["No specific review focus detected."];
  const fileItems = analysis.files.length
    ? analysis.files.map(
        (file) => `${file.path} (+${file.additions}/-${file.deletions}, ${file.hunks} hunks)`
      )
    : ["No changed files detected."];
  const securitySection = analysis.securityChecklist?.length
    ? [
        "",
        "### Security checklist",
        ...asBullets(analysis.securityChecklist),
        "",
        "Treat these as review prompts, not confirmed vulnerabilities."
      ]
    : [];

  return [
    COMMENT_MARKER,
    "## Maintainer Kit PR Review",
    "",
    `Repository: \`${repository || "unknown"}\``,
    `Risk: **${analysis.riskLevel}**`,
    `Files: ${analysis.filesChanged} changed, +${analysis.totalAdditions}/-${analysis.totalDeletions}`,
    `Labels: ${labels}`,
    "",
    "### Review focus",
    ...asBullets(focusItems),
    "",
    "### Changed files",
    ...asBullets(fileItems),
    ...securitySection,
    "",
    "### Maintainer note",
    "This comment is a starting point. Review the code, tests, compatibility impact, and project conventions before acting."
  ].join("\n");
}

function asBullets(items) {
  return items.map((item) => `- ${item}`);
}
