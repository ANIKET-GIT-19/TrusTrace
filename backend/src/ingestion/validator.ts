import crypto from "node:crypto";
import { z } from "zod";
import type { DataLabel } from "../domain/types.js";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const PriceRowSchema = z.object({
  ticker: z.string().min(1).max(32),
  trading_date: z.string().regex(isoDateRegex),
  close: z.number().positive(),
  volume: z.number().int().min(0),
});

export const BenchmarkRowSchema = z.object({
  benchmark_key: z.enum(["NIFTY_50", "SENSEX", "BANKNIFTY"]),
  trading_date: z.string().regex(isoDateRegex),
  close: z.number().positive(),
});

export const SebiEntryRowSchema = z.object({
  name: z.string().min(2).max(200),
  registration_no: z.string().regex(/^IN[A-Z]\d{9}$/),
  category: z.string().min(2).max(120),
  snapshot_date: z.string().regex(isoDateRegex),
});

export const StockInfoRowSchema = z.object({
  ticker: z.string().min(1).max(32),
  market_cap: z.number().min(0).nullable(),
  size_band: z.enum(["LARGE", "MID", "SMALL", "MICRO"]).nullable(),
  circuit_band: z.string().max(32).nullable(),
  classification_version: z.string().min(1).max(64),
});

export const SurveillanceRowSchema = z.object({
  ticker: z.string().min(1).max(32),
  list_name: z.string().min(2).max(64),
  is_active: z.boolean(),
  snapshot_date: z.string().regex(isoDateRegex),
});

export const TipRowSchema = z.object({
  influencer_name: z.string().min(1).max(160),
  ticker: z.string().min(1).max(32).nullable(),
  tip_date: z.string().regex(isoDateRegex),
  text: z.string().min(1).max(4000),
  direction: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]).nullable(),
  target_price: z.number().positive().nullable(),
  deadline: z.string().regex(isoDateRegex).nullable(),
  stop_loss: z.number().positive().nullable(),
  disclosure_grade: z.enum(["CLEAR", "VAGUE", "NONE", "UNKNOWN"]),
  source_url: z
    .string()
    .url()
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"))
    .nullable(),
  is_synthetic: z.boolean(),
});

export interface QuarantinedRow {
  rowIndex: number;
  reason: string;
}

export interface SnapshotValidationReport<T> {
  datasetKey: string;
  version: string;
  dataLabel: DataLabel;
  asOfDate: string;
  checksum: string;
  validRows: T[];
  rejectedRows: QuarantinedRow[];
  validationStatus: "VALID" | "PARTIAL" | "REJECTED";
}

export function computePayloadChecksum(rows: unknown[]): string {
  return crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

/**
 * Validates and deduplicates rows for an immutable dataset snapshot,
 * quarantining malformed or duplicate rows instead of silently coercing them.
 */
export function validateSnapshotBatch<T>(params: {
  datasetKey: string;
  version: string;
  dataLabel: DataLabel;
  asOfDate: string;
  rows: unknown[];
  schema: z.ZodType<T>;
  dedupeKey: (row: T) => string;
}): SnapshotValidationReport<T> {
  const validRows: T[] = [];
  const rejectedRows: QuarantinedRow[] = [];
  const seenKeys = new Set<string>();

  params.rows.forEach((rawRow, rowIndex) => {
    const parsed = params.schema.safeParse(rawRow);
    if (!parsed.success) {
      rejectedRows.push({
        rowIndex,
        reason: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
      return;
    }

    const key = params.dedupeKey(parsed.data);
    if (seenKeys.has(key)) {
      rejectedRows.push({
        rowIndex,
        reason: `Duplicate key detected: ${key}`,
      });
      return;
    }

    seenKeys.add(key);
    validRows.push(parsed.data);
  });

  const validationStatus: "VALID" | "PARTIAL" | "REJECTED" =
    validRows.length === 0 ? "REJECTED" : rejectedRows.length > 0 ? "PARTIAL" : "VALID";

  return {
    datasetKey: params.datasetKey,
    version: params.version,
    dataLabel: params.dataLabel,
    asOfDate: params.asOfDate,
    checksum: computePayloadChecksum(validRows),
    validRows,
    rejectedRows,
    validationStatus,
  };
}
