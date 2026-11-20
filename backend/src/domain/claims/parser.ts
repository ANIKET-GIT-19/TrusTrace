import { z } from "zod";
import type { ClaimLedger, SourceSpan, TipDirection } from "../types.js";

export const CLAIM_PARSER_VERSION = "claim-parser-v1";

export const SourceSpanSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  text: z.string().min(1),
});

export const ClaimLedgerSchema = z.object({
  stock: z.object({
    value: z.string().nullable(),
    status: z.enum(["EXTRACTED", "NOT_STATED", "UNCLEAR"]),
    note: z.string().optional(),
    evidence: SourceSpanSchema.nullable(),
  }),
  direction: z.object({
    value: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]).nullable(),
    status: z.enum(["EXTRACTED", "NOT_STATED", "UNCLEAR"]),
    note: z.string().optional(),
    evidence: SourceSpanSchema.nullable(),
  }),
  target_price: z.object({
    value: z.number().positive().nullable(),
    status: z.enum(["EXTRACTED", "NOT_STATED", "UNCLEAR"]),
    note: z.string().optional(),
    evidence: SourceSpanSchema.nullable(),
  }),
  deadline: z.object({
    value: z.string().nullable(),
    status: z.enum(["EXTRACTED", "NOT_STATED", "UNCLEAR"]),
    note: z.string().optional(),
    evidence: SourceSpanSchema.nullable(),
  }),
  stop_loss: z.object({
    value: z.number().positive().nullable(),
    status: z.enum(["EXTRACTED", "NOT_STATED", "UNCLEAR"]),
    gated: z.boolean().optional(),
    note: z.string().optional(),
    evidence: SourceSpanSchema.nullable(),
  }),
});

export interface CatalogueStockCandidate {
  ticker: string;
  company_name: string;
  aliases?: string[];
}

export function validateSpanAgainstSource(sourceText: string, span: SourceSpan | null): SourceSpan | null {
  if (!span) return null;
  if (span.start < 0 || span.end <= span.start || span.end > sourceText.length) {
    return null;
  }
  const actualSlice = sourceText.slice(span.start, span.end);
  if (actualSlice.toLowerCase() !== span.text.toLowerCase()) {
    return null;
  }
  return { start: span.start, end: span.end, text: actualSlice };
}

function makeSpan(match: RegExpExecArray): SourceSpan {
  return {
    start: match.index,
    end: match.index + match[0].length,
    text: match[0],
  };
}

function parseNumericToken(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function parseClaimLedgerDeterministic(params: {
  sourceText: string;
  catalogue: CatalogueStockCandidate[];
  userEnteredStock?: string;
}): ClaimLedger {
  const { sourceText, catalogue, userEnteredStock } = params;
  const text = sourceText ?? "";

  // 1. Stock / Instrument extraction against catalogue (never invent unverified tickers)
  let stockField: ClaimLedger["stock"] = {
    value: null,
    status: "NOT_STATED",
    evidence: null,
  };

  for (const item of catalogue) {
    const terms = [item.ticker.replace(/_/g, " "), item.company_name, ...(item.aliases ?? [])]
      .filter((t) => t.trim().length >= 3)
      .sort((a, b) => b.length - a.length);

    let matchedSpan: SourceSpan | null = null;
    for (const term of terms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      const match = regex.exec(text);
      if (match) {
        matchedSpan = makeSpan(match);
        break;
      }
    }
    if (matchedSpan) {
      stockField = {
        value: item.company_name,
        status: "EXTRACTED",
        evidence: matchedSpan,
      };
      break;
    }
  }

  // If text did not match a catalogue entry but the user explicitly supplied stock_name
  if (stockField.status === "NOT_STATED" && userEnteredStock && userEnteredStock.trim().length > 0) {
    stockField = {
      value: userEnteredStock.trim(),
      status: "UNCLEAR",
      note: "Entered by user; not matched verbatim inside source text.",
      evidence: null,
    };
  }

  // 2. Direction extraction (BULLISH / BEARISH)
  let directionField: ClaimLedger["direction"] = {
    value: null,
    status: "NOT_STATED",
    evidence: null,
  };

  const bullishMatch = /\b(buy(?:\s+above|\s+now|\s+at)?|bullish|long|upside|breakout|kharido|kharid\s*lo|accumulate|ce\b)/i.exec(
    text
  );
  const bearishMatch = /\b(sell(?:\s+below|\s+now)?|bearish|short|downside|breakdown|becho|bech\s*do|pe\b)/i.exec(
    text
  );

  if (bullishMatch && bearishMatch) {
    directionField = {
      value: null,
      status: "UNCLEAR",
      note: "Both upward and downward cues appeared in the text.",
      evidence: makeSpan(bullishMatch),
    };
  } else if (bullishMatch) {
    directionField = {
      value: "BULLISH" as TipDirection,
      status: "EXTRACTED",
      evidence: makeSpan(bullishMatch),
    };
  } else if (bearishMatch) {
    directionField = {
      value: "BEARISH" as TipDirection,
      status: "EXTRACTED",
      evidence: makeSpan(bearishMatch),
    };
  }

  // 3. Target price (strictly creator's original claim, never an app conclusion)
  let targetField: ClaimLedger["target_price"] = {
    value: null,
    status: "NOT_STATED",
    evidence: null,
  };
  const targetRegex = /\b(?:target|tgt|t1|t2|tp)\s*[:\-=@]?\s*(?:rs\.?|₹|inr)?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/i;
  const targetMatch = targetRegex.exec(text);
  if (targetMatch && targetMatch[1]) {
    const val = parseNumericToken(targetMatch[1]);
    if (val !== null) {
      targetField = {
        value: val,
        status: "EXTRACTED",
        note: "Creator's claimed target price only; not an application conclusion.",
        evidence: makeSpan(targetMatch),
      };
    }
  }

  // 4. Deadline / horizon
  let deadlineField: ClaimLedger["deadline"] = {
    value: null,
    status: "NOT_STATED",
    evidence: null,
  };
  const explicitHorizon =
    /\b(\d{1,3}\s*(?:day|days|week|weeks|month|months|trading\s*sessions?|din)|intraday|btst|expiry\s+\d{1,2}\s+[a-z]{3,9}|by\s+\d{1,2}\s+[a-z]{3,9}(?:\s+\d{4})?|\d{4}-\d{2}-\d{2})\b/i.exec(
      text
    );
  const vagueHorizon = /\b(soon|short\s*term|long\s*term|jaldi|coming\s*days)\b/i.exec(text);

  if (explicitHorizon) {
    deadlineField = {
      value: explicitHorizon[0].trim(),
      status: "EXTRACTED",
      evidence: makeSpan(explicitHorizon),
    };
  } else if (vagueHorizon) {
    deadlineField = {
      value: vagueHorizon[0].trim(),
      status: "UNCLEAR",
      note: "Time horizon is vague and lacks an explicit resolution date.",
      evidence: makeSpan(vagueHorizon),
    };
  }

  // 5. Stop-loss — explicitly detect paywalled/gated stop-loss cues (SL PAID, SL. VIP PREMIUM)
  let stopLossField: ClaimLedger["stop_loss"] = {
    value: null,
    status: "NOT_STATED",
    gated: false,
    evidence: null,
  };

  const gatedSlRegex =
    /\b(?:sl|stop[\s-]*loss)\s*[:.\-\s]*(?:paid|vip(?:\s*premium)?|premium|in\s*(?:vip|paid)\s*(?:group|channel)?|members\s*only|dm)\b/i;
  const gatedMatch = gatedSlRegex.exec(text);
  if (gatedMatch) {
    stopLossField = {
      value: null,
      status: "NOT_STATED",
      gated: true,
      note: "Stop-loss is gated behind a paid/VIP tier rather than stated openly.",
      evidence: makeSpan(gatedMatch),
    };
  } else {
    const slRegex =
      /\b(?:sl|stop[\s-]*loss)\s*[:.\-=@]?\s*(?:rs\.?|₹|inr)?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/i;
    const slMatch = slRegex.exec(text);
    if (slMatch && slMatch[1]) {
      const val = parseNumericToken(slMatch[1]);
      if (val !== null) {
        stopLossField = {
          value: val,
          status: "EXTRACTED",
          gated: false,
          evidence: makeSpan(slMatch),
        };
      }
    }
  }

  // Validate against Zod schema and verify every evidence span against source text
  const candidate: ClaimLedger = {
    stock: { ...stockField, evidence: validateSpanAgainstSource(text, stockField.evidence) },
    direction: {
      ...directionField,
      evidence: validateSpanAgainstSource(text, directionField.evidence),
    },
    target_price: {
      ...targetField,
      evidence: validateSpanAgainstSource(text, targetField.evidence),
    },
    deadline: {
      ...deadlineField,
      evidence: validateSpanAgainstSource(text, deadlineField.evidence),
    },
    stop_loss: {
      ...stopLossField,
      evidence: validateSpanAgainstSource(text, stopLossField.evidence),
    },
  };

  return ClaimLedgerSchema.parse(candidate);
}
