import type { AppEnv } from "../core/env.js";
import { getSupabaseAdminClient } from "./supabase.js";
import {
  DEMO_DATASET,
  type BenchmarkBarRecord,
  type CuratedTipRecord,
  type DemoCaseMeta,
  type InfluencerRecord,
  type SnapshotRecord,
  type StockRecord,
} from "../ingestion/demoCorpus.js";
import type {
  PriceBar,
  StockInfoSnapshot,
  SurveillanceSnapshot,
} from "../domain/market-checks/checks.js";
import type { DataLabel, SebiRegisterEntryRecord } from "../domain/types.js";
import { normalizeIdentifier } from "../domain/sebi/lookup.js";

export interface EvidenceRepository {
  listSnapshots(): Promise<SnapshotRecord[]>;
  listDemoCases(): Promise<DemoCaseMeta[]>;
  listBenchmarks(): Promise<Record<"NIFTY_50" | "SENSEX" | "BANKNIFTY", BenchmarkBarRecord[]>>;
  listSebiEntries(): Promise<{
    entries: SebiRegisterEntryRecord[];
    snapshotId: string | null;
    snapshotDate: string | null;
    dataLabel: DataLabel | null;
  }>;
  listInfluencers(): Promise<InfluencerRecord[]>;
  findInfluencerByQuery(query: string): Promise<InfluencerRecord | null>;
  findInfluencerById(id: string): Promise<InfluencerRecord | null>;
  searchStocks(query: string): Promise<StockRecord[]>;
  getStockByTicker(ticker: string): Promise<StockRecord | null>;
  getPriceHistory(ticker: string, fromDate?: string, toDate?: string): Promise<PriceBar[]>;
  getStockInfo(ticker: string): Promise<StockInfoSnapshot | null>;
  getSurveillance(ticker: string): Promise<SurveillanceSnapshot[]>;
  getTipsByInfluencer(params: {
    influencerId: string;
    ticker?: string;
    date?: string;
  }): Promise<CuratedTipRecord[]>;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * In-memory validated snapshot repository backed by the curated demo corpus,
 * with automatic live Supabase PostgreSQL reads when SUPABASE_SERVICE_ROLE_KEY is configured.
 */
export function createEvidenceRepository(config: AppEnv): EvidenceRepository {
  const supabase = getSupabaseAdminClient(config);

  return {
    async listSnapshots(): Promise<SnapshotRecord[]> {
      if (supabase) {
        const { data, error } = await supabase
          .from("data_snapshot")
          .select("*")
          .order("as_of_date", { ascending: false });
        if (!error && data && data.length > 0) {
          return data as SnapshotRecord[];
        }
      }
      return DEMO_DATASET.snapshots;
    },

    async listDemoCases(): Promise<DemoCaseMeta[]> {
      return DEMO_DATASET.demoCases;
    },

    async listBenchmarks() {
      if (supabase) {
        const { data, error } = await supabase
          .from("benchmark_history")
          .select("benchmark_key, trading_date, close, snapshot_id, data_snapshot(source_name, data_label)")
          .order("trading_date", { ascending: true });
        if (!error && data && data.length > 0) {
          const grouped: Record<"NIFTY_50" | "SENSEX" | "BANKNIFTY", BenchmarkBarRecord[]> = {
            NIFTY_50: [],
            SENSEX: [],
            BANKNIFTY: [],
          };
          const rows = data as unknown as Array<{
            benchmark_key: "NIFTY_50" | "SENSEX" | "BANKNIFTY";
            trading_date: string;
            close: string | number;
            snapshot_id: string;
            data_snapshot:
              | { source_name: string; data_label: DataLabel }
              | Array<{ source_name: string; data_label: DataLabel }>
              | null;
          }>;
          for (const row of rows) {
            if (row.benchmark_key in grouped) {
              const snap = unwrapRelation(row.data_snapshot);
              grouped[row.benchmark_key].push({
                benchmark_key: row.benchmark_key,
                trading_date: row.trading_date,
                close: Number(row.close),
                snapshot_id: row.snapshot_id,
                source_name: snap?.source_name ?? "Supabase Benchmark Snapshot",
                data_label: snap?.data_label ?? "SYNTHETIC",
              });
            }
          }
          if (grouped.NIFTY_50.length > 0) return grouped;
        }
      }
      return DEMO_DATASET.benchmarks;
    },

    async listSebiEntries() {
      if (supabase) {
        const { data, error } = await supabase
          .from("sebi_register_entry")
          .select("id, snapshot_id, name, normalized_name, registration_no, category, snapshot_date, data_snapshot(data_label)")
          .order("snapshot_date", { ascending: false });
        if (!error && data && data.length > 0) {
          const rows = data as unknown as Array<
            SebiRegisterEntryRecord & {
              data_snapshot: { data_label: DataLabel } | Array<{ data_label: DataLabel }> | null;
            }
          >;
          const first = rows[0]!;
          const firstSnap = unwrapRelation(first.data_snapshot);
          return {
            entries: rows.map((r) => ({
              id: r.id,
              snapshot_id: r.snapshot_id,
              name: r.name,
              normalized_name: r.normalized_name,
              registration_no: r.registration_no,
              category: r.category,
              snapshot_date: r.snapshot_date,
            })),
            snapshotId: first.snapshot_id,
            snapshotDate: first.snapshot_date,
            dataLabel: firstSnap?.data_label ?? "MIXED",
          };
        }
      }
      const sebiSnap = DEMO_DATASET.snapshots.find((s) => s.dataset_key === "sebi_register");
      return {
        entries: DEMO_DATASET.sebiEntries,
        snapshotId: sebiSnap?.id ?? null,
        snapshotDate: sebiSnap?.as_of_date ?? null,
        dataLabel: sebiSnap?.data_label ?? "MIXED",
      };
    },

    async listInfluencers(): Promise<InfluencerRecord[]> {
      if (supabase) {
        const { data, error } = await supabase.from("influencer").select("*");
        if (!error && data && data.length > 0) {
          return data as InfluencerRecord[];
        }
      }
      return DEMO_DATASET.influencers;
    },

    async findInfluencerByQuery(query: string): Promise<InfluencerRecord | null> {
      const norm = normalizeIdentifier(query);
      if (!norm) return null;
      const all = await this.listInfluencers();
      const compact = query.replace(/\s+/g, "").toUpperCase();
      return (
        all.find(
          (inf) =>
            normalizeIdentifier(inf.normalized_name || inf.name) === norm ||
            (inf.sebi_registration_no && inf.sebi_registration_no.toUpperCase() === compact) ||
            inf.aliases.some((alias) => normalizeIdentifier(alias) === norm)
        ) ?? null
      );
    },

    async findInfluencerById(id: string): Promise<InfluencerRecord | null> {
      const all = await this.listInfluencers();
      return all.find((inf) => inf.id === id) ?? null;
    },

    async searchStocks(query: string): Promise<StockRecord[]> {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) return DEMO_DATASET.stocks;
      const normalized = normalizeIdentifier(query);
      return DEMO_DATASET.stocks.filter((stock) => {
        if (stock.ticker.toLowerCase().includes(trimmed)) return true;
        if (stock.company_name.toLowerCase().includes(trimmed)) return true;
        if (normalizeIdentifier(stock.company_name).includes(normalized)) return true;
        return stock.aliases.some((a) => a.toLowerCase().includes(trimmed));
      });
    },

    async getStockByTicker(ticker: string): Promise<StockRecord | null> {
      const upper = ticker.trim().toUpperCase();
      const direct = DEMO_DATASET.stocks.find((s) => s.ticker.toUpperCase() === upper);
      if (direct) return direct;
      const byName = await this.searchStocks(ticker);
      return byName[0] ?? null;
    },

    async getPriceHistory(ticker: string, fromDate?: string, toDate?: string): Promise<PriceBar[]> {
      const upper = ticker.trim().toUpperCase();
      let bars: PriceBar[] = [];

      if (supabase) {
        let query = supabase
          .from("price_history")
          .select("trading_date, close, volume, snapshot_id, data_snapshot(source_name, data_label)")
          .eq("ticker", upper)
          .order("trading_date", { ascending: true });
        if (fromDate) query = query.gte("trading_date", fromDate);
        if (toDate) query = query.lte("trading_date", toDate);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const rows = data as unknown as Array<{
            trading_date: string;
            close: string | number;
            volume: number;
            snapshot_id: string;
            data_snapshot:
              | { source_name: string; data_label: DataLabel }
              | Array<{ source_name: string; data_label: DataLabel }>
              | null;
          }>;
          bars = rows.map((row) => {
            const snap = unwrapRelation(row.data_snapshot);
            return {
              trading_date: row.trading_date,
              close: Number(row.close),
              volume: Number(row.volume),
              snapshot_id: row.snapshot_id,
              source_name: snap?.source_name ?? "Supabase Price Snapshot",
              data_label: snap?.data_label ?? "SYNTHETIC",
            };
          });
          return bars;
        }
      }

      const demoBars = DEMO_DATASET.pricesByTicker[upper] ?? [];
      return demoBars.filter((bar) => {
        if (fromDate && bar.trading_date < fromDate) return false;
        if (toDate && bar.trading_date > toDate) return false;
        return true;
      });
    },

    async getStockInfo(ticker: string): Promise<StockInfoSnapshot | null> {
      const upper = ticker.trim().toUpperCase();
      return DEMO_DATASET.stockInfoByTicker[upper] ?? null;
    },

    async getSurveillance(ticker: string): Promise<SurveillanceSnapshot[]> {
      const upper = ticker.trim().toUpperCase();
      return DEMO_DATASET.surveillanceByTicker[upper] ?? [];
    },

    async getTipsByInfluencer(params: {
      influencerId: string;
      ticker?: string;
      date?: string;
    }): Promise<CuratedTipRecord[]> {
      const tickerUpper = params.ticker?.trim().toUpperCase();
      return DEMO_DATASET.tips.filter((tip) => {
        if (tip.influencer_id !== params.influencerId) return false;
        if (tickerUpper && tip.ticker.toUpperCase() !== tickerUpper) return false;
        if (params.date && tip.tip_date !== params.date) return false;
        return true;
      });
    },
  };
}
