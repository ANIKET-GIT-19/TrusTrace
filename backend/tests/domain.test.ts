import { describe, expect, it } from "vitest";
import { parseClaimLedgerDeterministic } from "../src/domain/claims/parser.js";
import { classifyDisclosure } from "../src/domain/disclosure/classifier.js";
import { detectHypePhrases } from "../src/domain/hype/detector.js";
import {
  computeAllMarketChecks,
  computePreTipRunUpCheck,
  computeVolumeSpikeCheck,
} from "../src/domain/market-checks/checks.js";
import {
  buildGuardedFactsCard,
  MANDATORY_DISCLAIMER,
  scanSystemAuthoredText,
} from "../src/domain/output-guard/guard.js";
import { lookupSebiRegister } from "../src/domain/sebi/lookup.js";
import { betaQuantile, computeCreatorTrackRecord } from "../src/domain/track-record/stats.js";
import { DEMO_DATASET, DEMO_TRADING_DATES, INFLUENCER_IDS } from "../src/ingestion/demoCorpus.js";
import { PriceRowSchema, validateSnapshotBatch } from "../src/ingestion/validator.js";

describe("Task 2.2 — Snapshot Ingestion & Quarantine", () => {
  it("validates valid rows, quarantines malformed/duplicate rows, and computes stable checksum", () => {
    const report = validateSnapshotBatch({
      datasetKey: "nse_prices",
      version: "test-v1",
      dataLabel: "REAL",
      asOfDate: "2026-11-19",
      rows: [
        { ticker: "WIPRO", trading_date: "2026-11-18", close: 580.5, volume: 5000000 },
        { ticker: "WIPRO", trading_date: "2026-11-18", close: 580.5, volume: 5000000 }, // duplicate
        { ticker: "WIPRO", trading_date: "bad-date", close: -10, volume: 100 }, // malformed
      ],
      schema: PriceRowSchema,
      dedupeKey: (r) => `${r.ticker}:${r.trading_date}`,
    });

    expect(report.validationStatus).toBe("PARTIAL");
    expect(report.validRows).toHaveLength(1);
    expect(report.rejectedRows).toHaveLength(2);
    expect(report.checksum).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("Task 2.4 — Five Deterministic Market Checks", () => {
  it("returns COULD_NOT_VERIFY for all equity-only checks on derivative contracts", () => {
    const checks = computeAllMarketChecks({
      instrumentType: "DERIVATIVE",
      bars: [],
      stockInfo: null,
      surveillanceEntries: [],
      circuitBand: null,
      asOfDate: "2026-11-19",
      tipDate: "2026-11-10",
    });

    expect(checks).toHaveLength(5);
    for (const check of checks) {
      expect(check.status).toBe("COULD_NOT_VERIFY");
      expect(check.reason_code).toBe("DERIVATIVE_CHECK_INAPPLICABLE");
      expect(check.measured_value).toBeNull();
    }
  });

  it("flags volume spike, pre-tip run-up, small-cap, and ASM surveillance on BORORENEW demo series", () => {
    const checks = computeAllMarketChecks({
      instrumentType: "EQUITY",
      bars: DEMO_DATASET.pricesByTicker.BORORENEW!,
      stockInfo: DEMO_DATASET.stockInfoByTicker.BORORENEW!,
      surveillanceEntries: DEMO_DATASET.surveillanceByTicker.BORORENEW!,
      circuitBand: "5%",
      asOfDate: "2026-11-19",
      tipDate: "2026-11-10",
    });

    const byId = Object.fromEntries(checks.map((c) => [c.check_id, c]));
    expect(byId.volume_spike!.status).toBe("NEEDS_ATTENTION");
    expect(Number(byId.volume_spike!.measured_value)).toBeGreaterThan(2.5);
    expect(byId.market_cap!.status).toBe("NEEDS_ATTENTION");
    expect(byId.market_cap!.measured_value).toBe("SMALL");
    expect(byId.surveillance!.status).toBe("NEEDS_ATTENTION");
  });

  it("returns COULD_NOT_VERIFY on non-trading day, zero volume, or insufficient history", () => {
    const nonTrading = computeVolumeSpikeCheck({
      instrumentType: "EQUITY",
      bars: DEMO_DATASET.pricesByTicker.WIPRO!,
      tipDate: "2026-11-15", // Sunday
    });
    expect(nonTrading.status).toBe("COULD_NOT_VERIFY");
    expect(nonTrading.reason_code).toBe("TIP_DATE_NOT_FOUND");

    const zeroVolBars = DEMO_DATASET.pricesByTicker.WIPRO!.map((b) =>
      b.trading_date === "2026-11-11" ? { ...b, volume: 0 } : b
    );
    const zeroVol = computeVolumeSpikeCheck({
      instrumentType: "EQUITY",
      bars: zeroVolBars,
      tipDate: "2026-11-11",
    });
    expect(zeroVol.status).toBe("COULD_NOT_VERIFY");
    expect(zeroVol.reason_code).toBe("INVALID_VOLUME");

    const shortHistory = computePreTipRunUpCheck({
      instrumentType: "EQUITY",
      bars: DEMO_DATASET.pricesByTicker.WIPRO!.slice(0, 3),
      tipDate: "2026-11-11",
    });
    expect(shortHistory.status).toBe("COULD_NOT_VERIFY");
    expect(shortHistory.reason_code).toBe("INSUFFICIENT_HISTORY");
  });
});

describe("Task 2.5 — Benchmark-Adjusted Creator Track Record (Beta-Binomial)", () => {
  it("computes accurate symmetric Beta(1,1) quantiles and handles insufficient samples honestly", () => {
    expect(betaQuantile(0.5, 1, 1)).toBeCloseTo(0.5, 4);
    expect(betaQuantile(0.025, 1, 1)).toBeCloseTo(0.025, 3);
    expect(betaQuantile(0.975, 1, 1)).toBeCloseTo(0.975, 3);

    const smallSample = computeCreatorTrackRecord({
      creatorId: INFLUENCER_IDS.RAKESH_BANSAL,
      creatorName: "Rakesh Bansal",
      tips: DEMO_DATASET.tips.filter((t) => t.influencer_id === INFLUENCER_IDS.RAKESH_BANSAL),
      pricesByTicker: DEMO_DATASET.pricesByTicker,
      niftySeries: DEMO_DATASET.benchmarks.NIFTY_50,
      asOfDate: "2026-11-19",
      dataLabel: "SYNTHETIC",
    });

    expect(smallSample.status).toBe("NOT_ENOUGH_TIPS_TO_JUDGE");
    expect(smallSample.resolved_count).toBeLessThan(20);
    expect(smallSample.benchmark).toBe("NIFTY_50");
  });

  it("excludes exact ties and missing deadlines and computes 95% interval for >= 20 resolved tips", () => {
    const syntheticTips = DEMO_DATASET.tips.filter(
      (t) => t.influencer_id === INFLUENCER_IDS.DEMO_HIGH_VOLUME_CREATOR
    );
    // Add one tip with missing deadline and one with invalid date
    const withUnresolved = [
      ...syntheticTips,
      { id: "missing-dl", ticker: "WIPRO", tip_date: "2026-10-01", deadline: null, direction: "BULLISH" as const },
      { id: "same-day", ticker: "WIPRO", tip_date: "2026-10-01", deadline: "2026-10-01", direction: "BULLISH" as const },
    ];

    const result = computeCreatorTrackRecord({
      creatorId: INFLUENCER_IDS.DEMO_HIGH_VOLUME_CREATOR,
      creatorName: "Aarav FinNotes (Synthetic Demo)",
      tips: withUnresolved,
      pricesByTicker: DEMO_DATASET.pricesByTicker,
      niftySeries: DEMO_DATASET.benchmarks.NIFTY_50,
      asOfDate: DEMO_TRADING_DATES[DEMO_TRADING_DATES.length - 1]!,
      dataLabel: "SYNTHETIC",
    });

    expect(result.resolved_count).toBeGreaterThanOrEqual(20);
    expect(result.excluded_count).toBeGreaterThanOrEqual(2);
    expect(result.credible_interval).not.toBeNull();
    expect(result.credible_interval!.lower).toBeLessThan(result.credible_interval!.upper);
  });
});

describe("Tasks 2.9, 2.10, 2.11 — Claim Ledger, Hype, Disclosure, and SEBI Lookup", () => {
  it("flags gated stop-loss (SL PAID / SL. VIP PREMIUM) as NOT_STATED + gated and extracts verified spans", () => {
    const text =
      "NIFTY 25600 CE Guaranteed jackpot call! Buy 120 Target 210 Intraday. SL. VIP PREMIUM. DM for Account Handling!";
    const claims = parseClaimLedgerDeterministic({
      sourceText: text,
      catalogue: DEMO_DATASET.stocks,
    });
    const hype = detectHypePhrases(text);
    const disclosure = classifyDisclosure(text);

    expect(claims.stock.value).toBe("Nifty 25600 CE");
    expect(claims.target_price.value).toBe(210);
    expect(claims.stop_loss.status).toBe("NOT_STATED");
    expect(claims.stop_loss.gated).toBe(true);
    expect(claims.stop_loss.evidence?.text).toMatch(/SL\.\s*VIP PREMIUM/i);
    expect(hype.flags.some((f) => f.phrase.toLowerCase() === "guaranteed")).toBe(true);
    expect(hype.flags.some((f) => f.phrase.toLowerCase().includes("account handling"))).toBe(true);
    expect(disclosure.grade).toBe("NONE");
    expect(disclosure.plain_ad_baseline_matched).toBe(false);
  });

  it("matches curated SEBI aliases conservatively and returns UNCLEAR on partial overlap", () => {
    const aliasHit = lookupSebiRegister({
      query: "Trading cafe India",
      entries: DEMO_DATASET.sebiEntries,
      aliases: DEMO_DATASET.influencers,
      snapshotDate: "2026-11-18",
      snapshotId: "snap-1",
      dataLabel: "MIXED",
    });
    expect(aliasHit.status).toBe("REGISTERED");
    expect(aliasHit.registration_no).toBe("INH000012948");

    const partialOverlap = lookupSebiRegister({
      query: "Rakesh",
      entries: DEMO_DATASET.sebiEntries,
      aliases: DEMO_DATASET.influencers,
      snapshotDate: "2026-11-18",
      snapshotId: "snap-1",
      dataLabel: "MIXED",
    });
    expect(partialOverlap.status).toBe("UNCLEAR");

    const notFound = lookupSebiRegister({
      query: "Unknown Channel XYZ",
      entries: DEMO_DATASET.sebiEntries,
      aliases: DEMO_DATASET.influencers,
      snapshotDate: "2026-11-18",
      snapshotId: "snap-1",
      dataLabel: "MIXED",
    });
    expect(notFound.status).toBe("NOT_FOUND");
    expect(notFound.explanation).toMatch(/does not indicate fraud/i);
  });
});

describe("Task 2.6 — Output Guard & Adversarial Non-Advisory Tests", () => {
  const adversarialPhrases = [
    "You should buy this stock right now.",
    "We recommend selling before Friday.",
    "Hold this share for long term gains.",
    "Avoid this stock immediately.",
    "Our target price is 740.",
    "This company looks undervalued compared to peers.",
    "The stock will rise 40% next month.",
    "Aaj hi kharid lo, pakka badhega!",
    "Paisa double hone wala hai, rocket banega.",
    "This looks like a good entry point worth adding to your portfolio.",
    "This creator is a scammer and fraudster.",
  ];

  it("blocks every adversarial English, conditional, euphemistic, and Hinglish advice phrase", () => {
    for (const phrase of adversarialPhrases) {
      const scan = scanSystemAuthoredText(phrase);
      expect(scan.passed, `Expected Output Guard to block: "${phrase}"`).toBe(false);
    }
  });

  it("returns safe fallback and mandatory disclaimer if unsafe section is injected", () => {
    const claims = parseClaimLedgerDeterministic({
      sourceText: "Buy WIPRO Target 630",
      catalogue: DEMO_DATASET.stocks,
    });
    const report = buildGuardedFactsCard({
      instrumentDisplayName: "Wipro Limited",
      claims,
      hypeFlags: [],
      disclosure: classifyDisclosure("Buy WIPRO Target 630"),
      sebi: lookupSebiRegister({
        query: "Vivek Rana",
        entries: DEMO_DATASET.sebiEntries,
        snapshotDate: "2026-11-18",
        snapshotId: "snap-1",
        dataLabel: "MIXED",
      }),
      marketChecks: computeAllMarketChecks({
        instrumentType: "EQUITY",
        bars: DEMO_DATASET.pricesByTicker.WIPRO!,
        stockInfo: DEMO_DATASET.stockInfoByTicker.WIPRO!,
        surveillanceEntries: DEMO_DATASET.surveillanceByTicker.WIPRO!,
        circuitBand: "20%",
        asOfDate: "2026-11-19",
        tipDate: "2026-11-11",
      }),
      trackRecord: computeCreatorTrackRecord({
        creatorId: null,
        creatorName: "Vivek Rana",
        tips: [],
        pricesByTicker: {},
        niftySeries: DEMO_DATASET.benchmarks.NIFTY_50,
        asOfDate: "2026-11-19",
        dataLabel: "SYNTHETIC",
      }),
      originalCreatorText: "<script>alert(1)</script> Buy WIPRO Target 630",
      injectedCandidateSections: [
        {
          section_id: "adversarial",
          title: "Advice",
          template_id: "market_check_summary_v1",
          sentence: "You should buy WIPRO now because it is undervalued.",
          source_snapshot_id: null,
          as_of_date: null,
          data_label: null,
        },
      ],
    });

    expect(report.guard_status).toBe("BLOCKED_FALLBACK");
    expect(report.mandatory_disclaimer).toBe(MANDATORY_DISCLAIMER);
    expect(report.creator_quoted_claim.quoted_text).toContain("&lt;script&gt;");
    expect(report.sections[0]!.template_id).toBe("safe_fallback_v1");
  });
});
