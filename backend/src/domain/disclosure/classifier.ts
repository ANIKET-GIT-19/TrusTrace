import type { DisclosureGradeResult, SourceSpan } from "../types.js";

export const DISCLOSURE_METHOD_VERSION = "disclosure-v1";

const CLEAR_PATTERNS: RegExp[] = [
  /\b(paid\s*(?:promotion|partnership|collaboration|sponsor(?:ship)?)|sponsored\s*(?:post|video|content|by))\b/gi,
  /#(?:ad|sponsored|paidpartnership|paidpromotion)\b/gi,
  /\bsebi\s*(?:registered|reg\.?\s*no\.?)\s*(?:ra|ia|research\s*analyst|investment\s*adviser)?\s*[:#-]?\s*in[a-z]\d{9}\b/gi,
  /\b(conflict\s*of\s*interest|financial\s*interest|holding(?:s)?\s*disclosure|personal\s*position\s*disclosed)\b/gi,
];

const VAGUE_PATTERNS: RegExp[] = [
  /\b(educational\s*purpose(?:s)?\s*only|for\s*learning\s*only|not\s*(?:a\s*)?sebi\s*registered|consult\s*your\s*(?:financial\s*)?advis[eo]r|do\s*your\s*own\s*research|dyor|disclaimer\s*in\s*bio|collab|partner(?:ed)?)\b/gi,
  /#(?:collab|partner|promo)\b/gi,
];

const PLAIN_AD_BASELINE = /#ad\b/i;

function collectMatches(text: string, patterns: RegExp[]): SourceSpan[] {
  const spans: SourceSpan[] = [];
  const seen = new Set<string>();
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null = regex.exec(text);
    while (match !== null) {
      const start = match.index;
      const matched = match[0];
      const end = start + matched.length;
      const key = `${start}:${end}`;
      if (!seen.has(key)) {
        seen.add(key);
        spans.push({ start, end, text: matched });
      }
      match = regex.exec(text);
    }
  }
  spans.sort((a, b) => a.start - b.start);
  return spans;
}

export function classifyDisclosure(sourceText: string): DisclosureGradeResult {
  const trimmed = sourceText.trim();
  const plainAdMatched = PLAIN_AD_BASELINE.test(trimmed);

  // Ambiguous / insufficient source text cannot be classified as "NONE" with false certainty
  if (trimmed.length < 12) {
    return {
      grade: "UNKNOWN",
      evidence: [],
      method_version: DISCLOSURE_METHOD_VERSION,
      plain_ad_baseline_matched: plainAdMatched,
      explanation:
        "Source text is too short or unavailable to evaluate sponsorship or conflict-of-interest disclosure.",
    };
  }

  const clearSpans = collectMatches(sourceText, CLEAR_PATTERNS);
  if (clearSpans.length > 0) {
    return {
      grade: "CLEAR",
      evidence: clearSpans,
      method_version: DISCLOSURE_METHOD_VERSION,
      plain_ad_baseline_matched: plainAdMatched,
      explanation:
        "Explicit sponsorship, conflict-of-interest, or SEBI registration disclosure wording was detected in the source text. This is a text classification, not a legal compliance certification.",
    };
  }

  const vagueSpans = collectMatches(sourceText, VAGUE_PATTERNS);
  if (vagueSpans.length > 0) {
    return {
      grade: "VAGUE",
      evidence: vagueSpans,
      method_version: DISCLOSURE_METHOD_VERSION,
      plain_ad_baseline_matched: plainAdMatched,
      explanation:
        "Generic disclaimer or informal collaboration language was detected, without explicit sponsorship or financial-interest terms. This is a descriptive classification, not a legal ruling.",
    };
  }

  return {
    grade: "NONE",
    evidence: [],
    method_version: DISCLOSURE_METHOD_VERSION,
    plain_ad_baseline_matched: plainAdMatched,
    explanation:
      "No explicit sponsorship, paid-promotion, or financial-interest disclosure wording was found in the provided text (plain #ad baseline also absent).",
  };
}
