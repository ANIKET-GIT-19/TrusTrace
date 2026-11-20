import type {
  ClaimLedger,
  DataLabel,
  DisclosureGradeResult,
  GuardedReportResponse,
  HypeFlag,
  MarketCheckResult,
  ReportSection,
  SebiLookupResult,
  TrackRecordResult,
} from "../types.js";

export const REPORT_VERSION = "facts-card-v1";

export const MANDATORY_DISCLAIMER =
  "This report describes historical facts and risk factors around a tip. It is not investment advice or SEBI-registered research. The decision is yours.";

export const ALLOWED_TEMPLATE_IDS = new Set([
  "claim_completeness_v1",
  "sebi_snapshot_v1",
  "disclosure_hype_v1",
  "market_check_summary_v1",
  "track_record_context_v1",
  "safe_fallback_v1",
]);

/**
 * Defense-in-depth prohibited advice scanner covering English direct recommendations,
 * valuation/prediction verbs, conditional advice, euphemisms, and Hinglish equivalents.
 */
const PROHIBITED_ADVICE_PATTERNS: Array<{ code: string; pattern: RegExp }> = [
  {
    code: "PROHIBITED_DIRECT_ACTION",
    pattern:
      /\b(buy|sell|hold|avoid|short\s+(?:it|this|the\s+stock)|go\s+long|accumulate|book\s+profit|exit\s+now|dump\s+(?:it|this)|stay\s+away\s+from)\b/i,
  },
  {
    code: "PROHIBITED_TARGET_OR_VALUATION",
    pattern:
      /\b(target\s*price|price\s*target|\btarget\b|undervalued|overvalued|fair\s*value\s*is|worth\s+rs\.?\s*\d+)\b/i,
  },
  {
    code: "PROHIBITED_PREDICTION",
    pattern:
      /\b(will\s+(?:rise|fall|rally|crash|double|triple|soar|plunge|skyrocket|outperform|underperform)|guaranteed\s+(?:return|profit|gain)|sure\s*shot|safe\s+bet|multibagger)\b/i,
  },
  {
    code: "PROHIBITED_CONDITIONAL_OR_EUPHEMISM",
    pattern:
      /\b(you\s+should\s+(?:invest|enter|exit|skip|pass)|we\s+recommend|good\s+(?:entry|exit)\s*point|worth\s+adding\s+to\s+your\s+portfolio|consider\s+(?:picking\s+up|entering|exiting)|smart\s+to\s+(?:enter|pass|skip)|better\s+to\s+skip|looks\s+like\s+a\s+winner|strong\s+upside\s+ahead)\b/i,
  },
  {
    code: "PROHIBITED_HINGLISH_ADVICE",
    pattern:
      /\b(kharido|kharid\s*lo|becho|bech\s*do|le\s*lo|mat\s*lo|pakka\s*(?:badhega|girega)|paisa\s*double|rocket\s*banega|uper\s*jayega|niche\s*girega|invest\s*karo|mat\s*lagao)\b/i,
  },
  {
    code: "PROHIBITED_ACCUSATION",
    pattern: /\b(scammer|fraudster|illegal\s+operator|criminal\s+scheme|is\s+a\s+fraud|is\s+a\s+scam)\b/i,
  },
];

export interface OutputGuardScanResult {
  passed: boolean;
  blockedReason: string | null;
}

export function scanSystemAuthoredText(sentence: string): OutputGuardScanResult {
  for (const rule of PROHIBITED_ADVICE_PATTERNS) {
    if (rule.pattern.test(sentence)) {
      return { passed: false, blockedReason: rule.code };
    }
  }
  return { passed: true, blockedReason: null };
}

export function escapeQuotedCreatorText(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSafeFallbackResponse(params: {
  reason: string;
  quotedText: string | null;
  claimedTarget: number | null;
  provenance: GuardedReportResponse["provenance_summary"];
}): GuardedReportResponse {
  return {
    report_version: REPORT_VERSION,
    guard_status: "BLOCKED_FALLBACK",
    guard_blocked_reason: params.reason,
    information_verdict_title: "Information & Evidence Verdict",
    sections: [
      {
        section_id: "fallback",
        title: "Evidence Summary Unavailable",
        template_id: "safe_fallback_v1",
        sentence:
          "A summary sentence did not pass the non-advisory Output Guard and was withheld. Inspect the individual dated evidence checks and source snapshots directly.",
        source_snapshot_id: null,
        as_of_date: null,
        data_label: null,
      },
    ],
    creator_quoted_claim: {
      label: "Creator's claim",
      quoted_text: params.quotedText ? escapeQuotedCreatorText(params.quotedText) : null,
      target_price_claimed: params.claimedTarget,
      disclaimer:
        "Quoted directly from the creator's original material; not an application conclusion.",
    },
    provenance_summary: params.provenance,
    mandatory_disclaimer: MANDATORY_DISCLAIMER,
  };
}

export interface BuildReportInput {
  instrumentDisplayName: string;
  claims: ClaimLedger;
  hypeFlags: HypeFlag[];
  disclosure: DisclosureGradeResult;
  sebi: SebiLookupResult;
  marketChecks: MarketCheckResult[];
  trackRecord: TrackRecordResult;
  originalCreatorText: string | null;
  /** Optional internal hook for adversarial Output Guard verification in tests only */
  injectedCandidateSections?: ReportSection[];
}

export function buildGuardedFactsCard(input: BuildReportInput): GuardedReportResponse {
  const snapshotIds = new Set<string>();
  const asOfDates = new Set<string>();
  const dataLabels = new Set<DataLabel>();

  if (input.sebi.snapshot_id) snapshotIds.add(input.sebi.snapshot_id);
  if (input.sebi.snapshot_date) asOfDates.add(input.sebi.snapshot_date);
  if (input.sebi.data_label) dataLabels.add(input.sebi.data_label);

  for (const check of input.marketChecks) {
    if (check.source_snapshot_id) snapshotIds.add(check.source_snapshot_id);
    if (check.as_of_date) asOfDates.add(check.as_of_date);
    if (check.data_label) dataLabels.add(check.data_label);
  }
  if (input.trackRecord.as_of_date) asOfDates.add(input.trackRecord.as_of_date);
  if (input.trackRecord.data_label) dataLabels.add(input.trackRecord.data_label);

  const provenance: GuardedReportResponse["provenance_summary"] = {
    snapshot_ids: [...snapshotIds],
    as_of_dates: [...asOfDates].sort(),
    data_labels: [...dataLabels],
  };

  // Template 1: Claim completeness (never mentions prohibited word "target" in system prose)
  const omittedLabels: string[] = [];
  if (input.claims.direction.status !== "EXTRACTED") omittedLabels.push("stated direction");
  if (input.claims.target_price.status !== "EXTRACTED") omittedLabels.push("claimed price level");
  if (input.claims.deadline.status !== "EXTRACTED") omittedLabels.push("explicit time horizon");
  if (input.claims.stop_loss.status !== "EXTRACTED") {
    omittedLabels.push(
      input.claims.stop_loss.gated ? "open stop-loss (gated behind paid tier)" : "stop-loss level"
    );
  }

  const completenessSentence =
    omittedLabels.length === 0
      ? `All primary claim fields were explicitly present in the inspected material for ${input.instrumentDisplayName}.`
      : `In the inspected material for ${input.instrumentDisplayName}, the following details were not stated or remained unclear: ${omittedLabels.join(", ")}.`;

  // Template 2: SEBI Register Snapshot
  let sebiSentence: string;
  if (input.sebi.status === "REGISTERED" && input.sebi.registration_no && input.sebi.snapshot_date) {
    sebiSentence = `The creator matched registration ${input.sebi.registration_no} (${input.sebi.category ?? "SEBI intermediary"}) in the SEBI register snapshot dated ${input.sebi.snapshot_date}.`;
  } else if (input.sebi.status === "NOT_FOUND" && input.sebi.snapshot_date) {
    sebiSentence = `The creator was not found in the SEBI register snapshot dated ${input.sebi.snapshot_date}; a missing snapshot match does not establish wrongdoing.`;
  } else {
    sebiSentence = `Creator identity in the SEBI register snapshot remained unclear${input.sebi.snapshot_date ? ` as of ${input.sebi.snapshot_date}` : ""}.`;
  }

  // Template 3: Disclosure & Language Audit
  const disclosureTextMap: Record<DisclosureGradeResult["grade"], string> = {
    CLEAR: "Clear disclosure",
    VAGUE: "Vague disclosure",
    NONE: "No disclosure wording found",
    UNKNOWN: "Unclear due to limited text",
  };
  const hypeCount = input.hypeFlags.length;
  const languageSentence = `Disclosure classification: ${disclosureTextMap[input.disclosure.grade]} (${input.disclosure.method_version}). Language audit flagged ${hypeCount} urgency or promotional cue${hypeCount === 1 ? "" : "s"} in the source text as descriptive text evidence only.`;

  // Template 4: Five Deterministic Market Checks
  const attentionChecks = input.marketChecks.filter((c) => c.status === "NEEDS_ATTENTION");
  const unverifiedChecks = input.marketChecks.filter((c) => c.status === "COULD_NOT_VERIFY");
  const normalChecks = input.marketChecks.filter((c) => c.status === "WITHIN_NORMAL_RANGE");

  const marketSummaryParts: string[] = [];
  if (attentionChecks.length > 0) {
    marketSummaryParts.push(
      `${attentionChecks.length} check${attentionChecks.length === 1 ? "" : "s"} marked Needs attention (${attentionChecks.map((c) => c.label).join(", ")})`
    );
  }
  if (normalChecks.length > 0) {
    marketSummaryParts.push(
      `${normalChecks.length} check${normalChecks.length === 1 ? "" : "s"} within normal range`
    );
  }
  if (unverifiedChecks.length > 0) {
    marketSummaryParts.push(
      `${unverifiedChecks.length} check${unverifiedChecks.length === 1 ? "" : "s"} could not be verified (${unverifiedChecks.map((c) => c.label).join(", ")})`
    );
  }
  const latestMarketCheck = input.marketChecks.find((c) => c.as_of_date !== null);
  const marketSentence = `Across the five deterministic market checks for ${input.instrumentDisplayName}: ${marketSummaryParts.join("; ")}.`;

  // Template 5: Creator Track Record Context
  let trackSentence: string;
  if (
    input.trackRecord.status === "INTERVAL_AVAILABLE" &&
    input.trackRecord.credible_interval
  ) {
    const lowPct = Math.round(input.trackRecord.credible_interval.lower * 100);
    const highPct = Math.round(input.trackRecord.credible_interval.upper * 100);
    trackSentence = `Across ${input.trackRecord.resolved_count} resolved historical tips benchmarked against ${input.trackRecord.benchmark}, the 95% Beta-Binomial credible interval is ${lowPct}% to ${highPct}% (${input.trackRecord.excluded_count} excluded). Historical context does not establish future performance.`;
  } else {
    trackSentence = `Creator historical track record status: Not enough tips to judge (${input.trackRecord.resolved_count} resolved tips against a ${input.trackRecord.minimum_sample_policy}-tip provisional minimum and ${input.trackRecord.benchmark} benchmark).`;
  }

  const candidateSections: ReportSection[] = input.injectedCandidateSections ?? [
    {
      section_id: "claim_completeness",
      title: "Claim Completeness",
      template_id: "claim_completeness_v1",
      sentence: completenessSentence,
      source_snapshot_id: null,
      as_of_date: null,
      data_label: null,
    },
    {
      section_id: "sebi_snapshot",
      title: "SEBI Register Snapshot",
      template_id: "sebi_snapshot_v1",
      sentence: sebiSentence,
      source_snapshot_id: input.sebi.snapshot_id,
      as_of_date: input.sebi.snapshot_date,
      data_label: input.sebi.data_label,
    },
    {
      section_id: "disclosure_hype",
      title: "Disclosure & Language Evidence",
      template_id: "disclosure_hype_v1",
      sentence: languageSentence,
      source_snapshot_id: null,
      as_of_date: null,
      data_label: null,
    },
    {
      section_id: "market_checks",
      title: "Historical Market Context",
      template_id: "market_check_summary_v1",
      sentence: marketSentence,
      source_snapshot_id: latestMarketCheck?.source_snapshot_id ?? null,
      as_of_date: latestMarketCheck?.as_of_date ?? null,
      data_label: latestMarketCheck?.data_label ?? null,
    },
    {
      section_id: "track_record",
      title: "Creator Track Record Context",
      template_id: "track_record_context_v1",
      sentence: trackSentence,
      source_snapshot_id: null,
      as_of_date: input.trackRecord.as_of_date,
      data_label: input.trackRecord.data_label,
    },
  ];

  // Mandatory Output Guard pipeline: enforce allowlist + prohibited wording scan on every system sentence
  for (const section of candidateSections) {
    if (!ALLOWED_TEMPLATE_IDS.has(section.template_id)) {
      return buildSafeFallbackResponse({
        reason: `UNAPPROVED_TEMPLATE_ID:${section.template_id}`,
        quotedText: input.originalCreatorText,
        claimedTarget: input.claims.target_price.value,
        provenance,
      });
    }
    const titleCheck = scanSystemAuthoredText(section.title);
    if (!titleCheck.passed) {
      return buildSafeFallbackResponse({
        reason: titleCheck.blockedReason ?? "GUARD_BLOCKED_TITLE",
        quotedText: input.originalCreatorText,
        claimedTarget: input.claims.target_price.value,
        provenance,
      });
    }
    const bodyCheck = scanSystemAuthoredText(section.sentence);
    if (!bodyCheck.passed) {
      return buildSafeFallbackResponse({
        reason: bodyCheck.blockedReason ?? "GUARD_BLOCKED_SENTENCE",
        quotedText: input.originalCreatorText,
        claimedTarget: input.claims.target_price.value,
        provenance,
      });
    }
  }

  return {
    report_version: REPORT_VERSION,
    guard_status: "PASSED",
    guard_blocked_reason: null,
    information_verdict_title: "Information & Evidence Verdict",
    sections: candidateSections,
    creator_quoted_claim: {
      label: "Creator's claim",
      quoted_text: input.originalCreatorText
        ? escapeQuotedCreatorText(input.originalCreatorText)
        : null,
      target_price_claimed: input.claims.target_price.value,
      disclaimer:
        "Quoted directly from the creator's original material; not an application conclusion.",
    },
    provenance_summary: provenance,
    mandatory_disclaimer: MANDATORY_DISCLAIMER,
  };
}
