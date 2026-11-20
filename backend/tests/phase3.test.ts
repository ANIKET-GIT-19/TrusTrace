import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/core/env.js";
import { SnapshotVersionCache } from "../src/core/snapshotCache.js";
import { runCalibrationComparison } from "../src/evaluation/calibration.js";
import { analyzeBehavioralStudyTrials } from "../src/evaluation/studyAnalysis.js";
import { synthesizeGuardedVoiceReadout } from "../src/integrations/sarvamVoice.js";

describe("Phase 3 — Caching, Optional Voice, Synthetic Demo Signal, Calibration & Study Harness", () => {
  const testConfig = loadEnv({
    APP_ENV: "test",
    NODE_ENV: "test",
    LLM_PROVIDER: "disabled",
  });
  const app = createApp({
    config: testConfig,
    probeDb: async () => ({ status: "connected", baselineVersion: "1.0-mern-supabase" }),
  });

  it("isolates SnapshotVersionCache keys by snapshot version so distinct snapshots never collide", () => {
    const cache = new SnapshotVersionCache();
    const k1 = SnapshotVersionCache.buildKey({
      namespace: "prices",
      snapshotVersion: "snap-v1",
      params: { ticker: "WIPRO" },
    });
    const k2 = SnapshotVersionCache.buildKey({
      namespace: "prices",
      snapshotVersion: "snap-v2",
      params: { ticker: "WIPRO" },
    });
    cache.set(k1, { close: 550 });
    cache.set(k2, { close: 590 });
    expect(cache.get(k1)).toEqual({ close: 550 });
    expect(cache.get(k2)).toEqual({ close: 590 });
  });

  it("returns DISABLED gracefully on POST /api/voice/readout when SARVAM_API_KEY is unset and handles provider failure", async () => {
    const res = await request(app).post("/api/voice/readout").send({
      guarded_text:
        "Across the five deterministic market checks for Wipro Limited, all five checks are within normal range.",
      language: "hi-IN",
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("DISABLED");
    expect(res.body.guard_verified).toBe(true);

    // Simulated provider network outage never crashes core flow
    const outage = await synthesizeGuardedVoiceReadout({
      guardedText: "The creator was not found in the SEBI register snapshot dated 2026-11-18.",
      language: "kn-IN",
      apiKey: "dummy-test-key",
      fetchImpl: async () => {
        throw new Error("Network unreachable");
      },
    });
    expect(outage.status).toBe("UNAVAILABLE");
    expect(outage.audio_base64).toBeNull();
  });

  it("serves strictly labelled synthetic coordinated-promotion demo signal separate from core checks", async () => {
    const res = await request(app).get("/api/meta/coordinated-demo?ticker=BORORENEW");
    expect(res.status).toBe(200);
    expect(res.body.feature_scope).toBe("OPTIONAL_SYNTHETIC_DEMO_ONLY");
    expect(res.body.is_synthetic).toBe(true);
    expect(res.body.data_label).toBe("SYNTHETIC");
    expect(res.body.distinct_channels_in_window).toBe(3);
    expect(res.body.limitations.length).toBeGreaterThanOrEqual(3);
  });

  it("computes calibration precision/recall/Wilson CIs vs naive small-cap baseline honestly", () => {
    const report = runCalibrationComparison();
    expect(report.is_provisional_synthetic_fixture).toBe(true);
    expect(report.five_check_composite.precision).toBeGreaterThan(
      report.naive_small_cap_baseline.precision
    );
    expect(report.five_check_composite.false_positive_rate).toBeLessThan(
      report.naive_small_cap_baseline.false_positive_rate
    );
    // Large-cap blind spot must remain visible as a false negative
    expect(report.five_check_composite.false_negatives).toBeGreaterThanOrEqual(1);
  });

  it("computes 3-arm study collapsed-tip action rate, skip rate, Brier score, and median time accurately", () => {
    const analysis = analyzeBehavioralStudyTrials([
      {
        participant_id: "p1",
        tip_id: "t1",
        arm: "ARM_A_DISCLAIMER",
        acted: true,
        tip_collapsed: true,
        stated_confidence_prob: 0.8,
        actual_beat_benchmark: false,
        decision_time_ms: 8000,
      },
      {
        participant_id: "p1",
        tip_id: "t2",
        arm: "ARM_C_TIP_AUTOPSY",
        acted: false,
        tip_collapsed: true,
        stated_confidence_prob: 0.2,
        actual_beat_benchmark: false,
        decision_time_ms: 24000,
      },
      {
        participant_id: "p1",
        tip_id: "t3",
        arm: "ARM_C_TIP_AUTOPSY",
        acted: true,
        tip_collapsed: false,
        stated_confidence_prob: 0.7,
        actual_beat_benchmark: true,
        decision_time_ms: 20000,
      },
    ]);

    expect(analysis.ARM_A_DISCLAIMER.collapsed_tip_action_rate).toBe(1);
    expect(analysis.ARM_A_DISCLAIMER.brier_score).toBeCloseTo(0.64, 4);
    expect(analysis.ARM_C_TIP_AUTOPSY.collapsed_tip_action_rate).toBe(0);
    expect(analysis.ARM_C_TIP_AUTOPSY.skipped_successful_tip_rate).toBe(0);
    expect(analysis.ARM_C_TIP_AUTOPSY.brier_score).toBeCloseTo(0.065, 3);
    expect(analysis.ARM_C_TIP_AUTOPSY.median_decision_time_ms).toBe(22000);
  });
});
