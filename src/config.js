import { readFile } from "node:fs/promises";

const SUPPORTED_FIELDS = new Set([
  "criticalPaths",
  "preferredLabels",
  "compatibilityPolicy",
  "releaseBranches",
  "reviewExpectations"
]);

const LIST_FIELDS = new Set(["criticalPaths", "releaseBranches", "reviewExpectations"]);
const MAP_FIELDS = new Set(["preferredLabels"]);

export async function loadMaintainerConfig(filePath) {
  if (!filePath) {
    return {};
  }

  const text = await readFile(filePath, "utf8");
  return parseMaintainerConfig(text);
}

export function parseMaintainerConfig(text) {
  const config = {};
  let currentField = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = stripComment(rawLine);
    if (!line.trim()) {
      continue;
    }

    const topLevelMatch = line.match(/^([A-Za-z][A-Za-z0-9]*):(?:\s*(.*))?$/);
    if (topLevelMatch) {
      const [, field, rawValue = ""] = topLevelMatch;
      assertSupportedField(field);
      currentField = field;

      if (LIST_FIELDS.has(field)) {
        config[field] = [];
      } else if (MAP_FIELDS.has(field)) {
        config[field] = {};
      } else {
        config[field] = unquote(rawValue.trim());
      }
      continue;
    }

    if (!currentField) {
      throw new Error(`Invalid config line: ${rawLine}`);
    }

    const listItemMatch = line.match(/^\s+-\s+(.+)$/);
    if (listItemMatch && LIST_FIELDS.has(currentField)) {
      config[currentField].push(unquote(listItemMatch[1].trim()));
      continue;
    }

    const mapItemMatch = line.match(/^\s+([A-Za-z][A-Za-z0-9_-]*):\s*(.+)$/);
    if (mapItemMatch && MAP_FIELDS.has(currentField)) {
      const [, key, value] = mapItemMatch;
      config[currentField][key] = unquote(value.trim());
      continue;
    }

    throw new Error(`Invalid config line for ${currentField}: ${rawLine}`);
  }

  return validateMaintainerConfig(config);
}

export function validateMaintainerConfig(config) {
  for (const field of Object.keys(config)) {
    assertSupportedField(field);
  }

  for (const field of LIST_FIELDS) {
    if (field in config && !Array.isArray(config[field])) {
      throw new Error(`${field} must be a list`);
    }
  }

  if (
    "preferredLabels" in config &&
    (!config.preferredLabels ||
      Array.isArray(config.preferredLabels) ||
      typeof config.preferredLabels !== "object")
  ) {
    throw new Error("preferredLabels must be a map");
  }

  return config;
}

function assertSupportedField(field) {
  if (!SUPPORTED_FIELDS.has(field)) {
    throw new Error(`Unsupported config field: ${field}`);
  }
}

function stripComment(line) {
  const commentIndex = line.indexOf("#");
  return commentIndex === -1 ? line : line.slice(0, commentIndex);
}

function unquote(value) {
  return value.replace(/^["']|["']$/g, "");
}
