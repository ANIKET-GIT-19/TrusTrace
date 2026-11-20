import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/core/env.js";
import { classifyDisclosure } from "../src/domain/disclosure/classifier.js";
import { parseClaimLedgerDeterministic } from "../src/domain/claims/parser.js";
import { computeAllMarketChecks } from "../src/domain/market-checks/checks.js";
import {
  buildGuardedFactsCard,
  MANDATORY_DISCLAIMER,
  scanSystemAuthoredText,
} from "../src/domain/output-guard/guard.js";
import { lookupSebiRegister } from "../src/domain/sebi/lookup.js";
import { computeCreatorTrackRecord } from "../src/domain/track-record/stats.js";
import { DEMO_DATASET } from "../src/ingestion/demoCorpus.js";

describe("Task 3.7 — Output Guard Adversarial Test Campaign (Release Gate)", () => {
  const adversarialSuite: Array<{ category: string; text: string }> = [
    // Direct English instructions
    { category: "direct_buy", text: "Buy BORORENEW immediately." },
    { category: "direct_sell", text: "Sell WIPRO before closing bell." },
    { category: "direct_hold", text: "Hold your position for 3 months." },
    { category: "direct_avoid", text: "Avoid this micro-cap stock altogether." },
    { category: "direct_accumulate", text: "Accumulate on every dip." },
    { category: "direct_short", text: "Short this stock for quick gains." },
    { category: "direct_long", text: "Go long above 620." },
    { category: "direct_book_profit", text: "Book profit at current levels." },
    { category: "direct_exit", text: "Exit now before liquidity dries up." },
    { category: "direct_dump", text: "Dump it at market open." },
    { category: "direct_stay_away", text: "Stay away from this counter." },
    { category: "direct_enter", text: "Enter now while momentum lasts." },
    { category: "direct_load_up", text: "Load up on shares before breakout." },

    // Valuation & target price leakage
    { category: "target_price", text: "Our target price for this security is 740." },
    { category: "price_target", text: "The implied price target stands at 900." },
    { category: "bare_target", text: "Set a target of 20% return." },
    { category: "undervalued", text: "The stock appears undervalued versus peers." },
    { category: "overvalued", text: "Current multiples look overvalued." },
    { category: "fair_value", text: "Fair value is around 650 per share." },
    { category: "cheap_valuation", text: "Trading at a cheap valuation right now." },
    { category: "richly_valued", text: "The equity is richly valued relative to earnings." },

    // Predictions & guarantees
    { category: "will_rise", text: "This share will rise sharply next week." },
    { category: "will_fall", text: "The stock will fall after the lock-in ends." },
    { category: "going_to_rally", text: "Prices are going to rally after volume spike." },
    { category: "bound_to_double", text: "This counter is bound to double soon." },
    { category: "guaranteed", text: "Guaranteed return over 30 sessions." },
    { category: "sure_shot", text: "This looks like a sure shot opportunity." },
    { category: "safe_bet", text: "Large-cap IT is a safe bet right now." },
    { category: "multibagger", text: "Potential multibagger over the next year." },

    // Conditional recommendations & euphemisms
    { category: "conditional_invest", text: "You should invest only if you tolerate risk." },
    { category: "conditional_skip", text: "You should skip this tip." },
    { category: "we_recommend", text: "We recommend waiting for confirmation." },
    { category: "good_entry", text: "Recent pullback created a good entry point." },
    { category: "attractive_entry", text: "Volume cooling offers an attractive entry." },
    { category: "worth_adding", text: "Worth adding to a diversified portfolio." },
    { category: "consider_picking_up", text: "Consider picking up a small tranche." },
    { category: "smart_to_pass", text: "It would be smart to pass on this name." },
    { category: "better_to_skip", text: "Better to skip until ASM clears." },
    { category: "looks_like_winner", text: "This chart looks like a winner." },
    { category: "smart_money", text: "Smart money is loading shares quietly." },
    { category: "if_dips_enter", text: "If it dips below 500, enter gradually." },
    { category: "only_invest_if", text: "Only invest if your horizon exceeds 1 year." },

    // Hindi / Hinglish equivalents
    { category: "hinglish_kharido", text: "Yeh stock abhi kharido." },
    { category: "hinglish_kharid_lo", text: "Breakout ke baad kharid lo." },
    { category: "hinglish_becho", text: "Upar jaate hi becho." },
    { category: "hinglish_bech_do", text: "Kal subah bech do." },
    { category: "hinglish_le_lo", text: "Dip pe le lo." },
    { category: "hinglish_le_lena", text: "Thoda le lena chahiye." },
    { category: "hinglish_mat_lo", text: "Is stock ko mat lo." },
    { category: "hinglish_pakka_badhega", text: "Yeh share pakka badhega." },
    { category: "hinglish_paisa_double", text: "Ek mahine mein paisa double ho sakta hai." },
    { category: "hinglish_rocket", text: "Kal rocket banega." },
    { category: "hinglish_nivesh", text: "Ismein nivesh karo." },
    { category: "hinglish_mauka", text: "Abhi mauka hai entry lene ka." },

    // Accusatory / defamatory language
    { category: "accusation_scammer", text: "This finfluencer is a scammer." },
    { category: "accusation_fraud", text: "This creator is a fraud because they are not registered." },
  ];

  it("blocks 100% of adversarial English, conditional, euphemistic, Hinglish, and accusatory prompts", () => {
    for (const item of adversarialSuite) {
      const scan = scanSystemAuthoredText(item.text);
      expect(scan.passed, `Failed to block [${item.category}]: "${item.text}"`).toBe(false);
    }
  });

  it("produces ZERO system-authored advice outputs across all curated demo corpus items", () => {
    for (const demo of DEMO_DATASET.demoCases) {
      const stock = DEMO_DATASET.stocks.find((s) => s.ticker === demo.ticker)!;
      const claims = parseClaimLedgerDeterministic({
        sourceText: demo.sample_text,
        catalogue: DEMO_DATASET.stocks,
      });
      const report = buildGuardedFactsCard({
        instrumentDisplayName: stock.company_name,
        claims,
        hypeFlags: [],
        disclosure: classifyDisclosure(demo.sample_text),
        sebi: lookupSebiRegister({
          query: demo.influencer_name,
          entries: DEMO_DATASET.sebiEntries,
          aliases: DEMO_DATASET.influencers,
          snapshotDate: "2026-11-18",
          snapshotId: "snap-sebi",
          dataLabel: "MIXED",
        }),
        marketChecks: computeAllMarketChecks({
          instrumentType: stock.instrument_type,
          bars: DEMO_DATASET.pricesByTicker[stock.ticker] ?? [],
          stockInfo: DEMO_DATASET.stockInfoByTicker[stock.ticker] ?? null,
          surveillanceEntries: DEMO_DATASET.surveillanceByTicker[stock.ticker] ?? [],
          circuitBand: stock.circuit_band,
          asOfDate: "2026-11-19",
          tipDate: demo.tip_date,
        }),
        trackRecord: computeCreatorTrackRecord({
          creatorId: demo.influencer_id,
          creatorName: demo.influencer_name,
          tips: DEMO_DATASET.tips.filter((t) => t.influencer_id === demo.influencer_id),
          pricesByTicker: DEMO_DATASET.pricesByTicker,
          niftySeries: DEMO_DATASET.benchmarks.NIFTY_50,
          asOfDate: "2026-11-19",
          dataLabel: "SYNTHETIC",
        }),
        originalCreatorText: demo.sample_text,
      });

      expect(report.guard_status).toBe("PASSED");
      expect(report.mandatory_disclaimer).toBe(MANDATORY_DISCLAIMER);
      for (const sec of report.sections) {
        expect(scanSystemAuthoredText(sec.title).passed).toBe(true);
        expect(scanSystemAuthoredText(sec.sentence).passed).toBe(true);
      }
    }
  });

  it("blocks unapproved template IDs and escapes XSS payloads in quoted creator text", () => {
    const claims = parseClaimLedgerDeterministic({
      sourceText: "Test",
      catalogue: DEMO_DATASET.stocks,
    });
    const report = buildGuardedFactsCard({
      instrumentDisplayName: "Wipro Limited",
      claims,
      hypeFlags: [],
      disclosure: classifyDisclosure("Test"),
      sebi: lookupSebiRegister({
        query: "Vivek Rana",
        entries: DEMO_DATASET.sebiEntries,
        snapshotDate: "2026-11-18",
        snapshotId: "snap-sebi",
        dataLabel: "MIXED",
      }),
      marketChecks: [],
      trackRecord: computeCreatorTrackRecord({
        creatorId: null,
        creatorName: null,
        tips: [],
        pricesByTicker: {},
        niftySeries: [],
        asOfDate: null,
        dataLabel: null,
      }),
      originalCreatorText: `<img src=x onerror="alert('xss')"> Buy now!`,
      injectedCandidateSections: [
        {
          section_id: "rogue",
          title: "Freeform LLM Output",
          template_id: "unapproved_llm_template_v99",
          sentence: "Neutral sentence from unapproved template.",
          source_snapshot_id: null,
          as_of_date: null,
          data_label: null,
        },
      ],
    });

    expect(report.guard_status).toBe("BLOCKED_FALLBACK");
    expect(report.guard_blocked_reason).toContain("UNAPPROVED_TEMPLATE_ID");
    expect(report.creator_quoted_claim.quoted_text).not.toContain("<img");
    expect(report.creator_quoted_claim.quoted_text).toContain("&lt;img");
  });

  it("blocks unsafe advice text from reaching POST /api/voice/readout (HTTP 422)", async () => {
    const app = createApp({
      config: loadEnv({ APP_ENV: "test", NODE_ENV: "test" }),
      probeDb: async () => ({ status: "connected", baselineVersion: "1.0-mern-supabase" }),
    });

    const blocked = await request(app).post("/api/voice/readout").send({
      guarded_text: "You should buy BORORENEW right now for guaranteed returns.",
      language: "en-IN",
    });

    expect(blocked.status).toBe(422);
    expect(blocked.body.error.code).toBe("VALIDATION_ERROR");
  });
});
