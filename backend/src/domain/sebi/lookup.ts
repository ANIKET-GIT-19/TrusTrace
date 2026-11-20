import type { DataLabel, SebiLookupResult, SebiRegisterEntryRecord } from "../types.js";

export interface InfluencerAliasRecord {
  name: string;
  normalized_name: string;
  aliases: string[];
  sebi_registration_no: string | null;
}

export function normalizeIdentifier(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

const SEBI_REG_NO_PATTERN = /^in[a-z]\d{9}$/i;

export function lookupSebiRegister(params: {
  query: string;
  entries: SebiRegisterEntryRecord[];
  aliases?: InfluencerAliasRecord[];
  snapshotDate: string | null;
  snapshotId: string | null;
  dataLabel: DataLabel | null;
}): SebiLookupResult {
  const { query, entries, aliases = [], snapshotDate, snapshotId, dataLabel } = params;
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      query: trimmed,
      status: "UNCLEAR",
      matched_name: null,
      registration_no: null,
      category: null,
      snapshot_id: snapshotId,
      snapshot_date: snapshotDate,
      data_label: dataLabel,
      explanation: "No creator name or SEBI registration number was provided for lookup.",
      candidates_considered: 0,
    };
  }

  if (entries.length === 0 || !snapshotDate) {
    return {
      query: trimmed,
      status: "UNCLEAR",
      matched_name: null,
      registration_no: null,
      category: null,
      snapshot_id: snapshotId,
      snapshot_date: snapshotDate,
      data_label: dataLabel,
      explanation:
        "No dated SEBI register snapshot is available to verify this creator. The rest of the analysis continues.",
      candidates_considered: 0,
    };
  }

  const normalizedQuery = normalizeIdentifier(trimmed);
  const compactQuery = trimmed.replace(/\s+/g, "").toUpperCase();

  // 1. Exact SEBI registration number match (authoritative deterministic key)
  if (SEBI_REG_NO_PATTERN.test(compactQuery)) {
    const exactRegMatches = entries.filter(
      (entry) => entry.registration_no.toUpperCase() === compactQuery
    );
    if (exactRegMatches.length === 1 && exactRegMatches[0]) {
      const hit = exactRegMatches[0];
      return {
        query: trimmed,
        status: "REGISTERED",
        matched_name: hit.name,
        registration_no: hit.registration_no,
        category: hit.category,
        snapshot_id: hit.snapshot_id,
        snapshot_date: hit.snapshot_date,
        data_label: dataLabel,
        explanation: `Exact registration number match found in the SEBI register snapshot dated ${hit.snapshot_date}.`,
        candidates_considered: 1,
      };
    }
    return {
      query: trimmed,
      status: "NOT_FOUND",
      matched_name: null,
      registration_no: null,
      category: null,
      snapshot_id: snapshotId,
      snapshot_date: snapshotDate,
      data_label: dataLabel,
      explanation: `Not found in SEBI register snapshot dated ${snapshotDate}. A missing match does not prove wrongdoing or non-compliance.`,
      candidates_considered: exactRegMatches.length,
    };
  }

  // 2. Exact normalized legal name match
  const exactNameMatches = entries.filter(
    (entry) => normalizeIdentifier(entry.normalized_name || entry.name) === normalizedQuery
  );

  if (exactNameMatches.length === 1 && exactNameMatches[0]) {
    const hit = exactNameMatches[0];
    return {
      query: trimmed,
      status: "REGISTERED",
      matched_name: hit.name,
      registration_no: hit.registration_no,
      category: hit.category,
      snapshot_id: hit.snapshot_id,
      snapshot_date: hit.snapshot_date,
      data_label: dataLabel,
      explanation: `Matched by exact name in the SEBI register snapshot dated ${hit.snapshot_date}.`,
      candidates_considered: 1,
    };
  }

  if (exactNameMatches.length > 1) {
    return {
      query: trimmed,
      status: "UNCLEAR",
      matched_name: null,
      registration_no: null,
      category: null,
      snapshot_id: snapshotId,
      snapshot_date: snapshotDate,
      data_label: dataLabel,
      explanation: `Multiple entries matched this name in the SEBI register snapshot dated ${snapshotDate}. Provide the exact registration number to disambiguate.`,
      candidates_considered: exactNameMatches.length,
    };
  }

  // 3. Curated channel/handle alias resolution -> must still verify against dated sebi_register_entry
  const matchingAliases = aliases.filter((record) => {
    const normRecordName = normalizeIdentifier(record.normalized_name || record.name);
    if (normRecordName === normalizedQuery) return true;
    return record.aliases.some((alias) => normalizeIdentifier(alias) === normalizedQuery);
  });

  if (matchingAliases.length === 1 && matchingAliases[0]) {
    const aliasRecord = matchingAliases[0];
    if (aliasRecord.sebi_registration_no) {
      const regHit = entries.find(
        (entry) =>
          entry.registration_no.toUpperCase() === aliasRecord.sebi_registration_no?.toUpperCase()
      );
      if (regHit) {
        return {
          query: trimmed,
          status: "REGISTERED",
          matched_name: regHit.name,
          registration_no: regHit.registration_no,
          category: regHit.category,
          snapshot_id: regHit.snapshot_id,
          snapshot_date: regHit.snapshot_date,
          data_label: dataLabel,
          explanation: `Matched curated channel alias to legal name "${regHit.name}" in the SEBI register snapshot dated ${regHit.snapshot_date}.`,
          candidates_considered: 1,
        };
      }
    }
  } else if (matchingAliases.length > 1) {
    return {
      query: trimmed,
      status: "UNCLEAR",
      matched_name: null,
      registration_no: null,
      category: null,
      snapshot_id: snapshotId,
      snapshot_date: snapshotDate,
      data_label: dataLabel,
      explanation: `Multiple curated creator aliases matched "${trimmed}". Identity remains unclear without an exact SEBI registration number.`,
      candidates_considered: matchingAliases.length,
    };
  }

  // 4. Conservative ambiguity check: partial token overlap returns UNCLEAR, never REGISTERED
  const queryTokens = normalizedQuery.split(" ").filter((t) => t.length >= 3);
  if (queryTokens.length > 0) {
    const partialMatches = entries.filter((entry) => {
      const entryNorm = normalizeIdentifier(entry.normalized_name || entry.name);
      return queryTokens.every((token) => entryNorm.includes(token));
    });
    if (partialMatches.length > 0) {
      return {
        query: trimmed,
        status: "UNCLEAR",
        matched_name: null,
        registration_no: null,
        category: null,
        snapshot_id: snapshotId,
        snapshot_date: snapshotDate,
        data_label: dataLabel,
        explanation: `Partial name overlap found in the SEBI register snapshot dated ${snapshotDate}, but identity could not be verified conservatively without a full name or registration number.`,
        candidates_considered: partialMatches.length,
      };
    }
  }

  // 5. Neutral NOT_FOUND result (never stops autopsy, never alleges fraud)
  return {
    query: trimmed,
    status: "NOT_FOUND",
    matched_name: null,
    registration_no: null,
    category: null,
    snapshot_id: snapshotId,
    snapshot_date: snapshotDate,
    data_label: dataLabel,
    explanation: `Not found in SEBI register snapshot dated ${snapshotDate}. A channel handle may differ from a legal name; not found does not indicate fraud or illegal activity.`,
    candidates_considered: 0,
  };
}
