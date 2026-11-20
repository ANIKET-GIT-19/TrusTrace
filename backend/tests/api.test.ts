import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/core/env.js";
import { MANDATORY_DISCLAIMER } from "../src/domain/output-guard/guard.js";
import { INFLUENCER_IDS } from "../src/ingestion/demoCorpus.js";

describe("Task 2.7 — Core REST API Integration & Media Privacy", () => {
  const testConfig = loadEnv({
    APP_ENV: "test",
    NODE_ENV: "test",
    PORT: "8000",
    FRONTEND_ORIGINS: "http://localhost:5173",
    LLM_PROVIDER: "disabled",
  });

  const app = createApp({
    config: testConfig,
    probeDb: async () => ({ status: "connected", baselineVersion: "1.0-mern-supabase" }),
  });

  it("parses Hinglish text via POST /api/tips/parse and flags missing/gated stop-loss and hype", async () => {
    const res = await request(app).post("/api/tips/parse").send({
      text: "Guaranteed 2x in 10 days, last chance! Borosil Renewables Ltd Buy 615 Target 740. SL PAID.",
      influencer_name: "Rakesh Bansal",
      stock_name: "Borosil Renewables Ltd",
    });

    expect(res.status).toBe(200);
    expect(res.body.claims.stock.value).toBe("Borosil Renewables Ltd");
    expect(res.body.claims.stop_loss.status).toBe("NOT_STATED");
    expect(res.body.claims.stop_loss.gated).toBe(true);
    expect(res.body.hype_flags.length).toBeGreaterThanOrEqual(2);
    expect(res.body.media_intake.persisted).toBe(false);
  });

  it("validates multipart photo magic bytes, rejects spoofed uploads, and never persists media", async () => {
    // Valid minimal JPEG header bytes (FF D8 FF E0 ...)
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
    const okRes = await request(app)
      .post("/api/tips/parse")
      .field("influencer_name", "Ashish Kyal")
      .field("stock_name", "Sensex 82900 CE")
      .attach("file", validJpeg, { filename: "Fake__Registered.jpeg", contentType: "image/jpeg" });

    expect(okRes.status).toBe(200);
    expect(okRes.body.media_intake.received).toBe(true);
    expect(okRes.body.media_intake.kind).toBe("PHOTO");
    expect(okRes.body.media_intake.persisted).toBe(false);
    expect(okRes.body.parser.status).toBe("FALLBACK_STRUCTURED_ONLY");

    // Spoofed executable/text masquerading as .jpeg must be rejected (415)
    const fakeJpeg = Buffer.from("THIS IS NOT A REAL JPEG IMAGE");
    const badRes = await request(app)
      .post("/api/tips/parse")
      .attach("file", fakeJpeg, { filename: "spoofed.jpeg", contentType: "image/jpeg" });

    expect(badRes.status).toBe(415);
    expect(badRes.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("returns exact-date tip markers on GET /api/influencers/:id/tips?ticker=&date=", async () => {
    const markersRes = await request(app).get(
      `/api/influencers/${INFLUENCER_IDS.RAKESH_BANSAL}/tips?ticker=BORORENEW`
    );
    expect(markersRes.status).toBe(200);
    expect(markersRes.body.mode).toBe("MARKERS");
    expect(markersRes.body.markers.length).toBe(2);

    const exactRes = await request(app).get(
      `/api/influencers/${INFLUENCER_IDS.RAKESH_BANSAL}/tips?ticker=BORORENEW&date=2026-11-10`
    );
    expect(exactRes.status).toBe(200);
    expect(exactRes.body.mode).toBe("EXACT_DATE");
    expect(exactRes.body.tips).toHaveLength(1);
    expect(exactRes.body.tips[0].tip_date).toBe("2026-11-10");
    expect(exactRes.body.tips[0].is_synthetic).toBe(true);
  });

  it("returns deterministic checks, derivative COULD_NOT_VERIFY, and guarded report with verbatim disclaimer", async () => {
    const derivativeChecks = await request(app).get(
      "/api/stocks/SENSEX_82900_CE/checks?asOf=2026-11-19&tipDate=2026-11-10"
    );
    expect(derivativeChecks.status).toBe(200);
    expect(derivativeChecks.body.instrument_type).toBe("DERIVATIVE");
    expect(
      derivativeChecks.body.checks.every((c: { status: string }) => c.status === "COULD_NOT_VERIFY")
    ).toBe(true);

    const reportRes = await request(app).post("/api/report").send({
      ticker: "BORORENEW",
      tip_date: "2026-11-10",
      as_of_date: "2026-11-19",
      influencer_name: "Rakesh Bansal",
      original_text: "Borosil Renewables Ltd Buy above 615 Target 740 in 15 days. SEBI Reg No INH100008984.",
    });
    expect(reportRes.status).toBe(200);
    expect(reportRes.body.guard_status).toBe("PASSED");
    expect(reportRes.body.mandatory_disclaimer).toBe(MANDATORY_DISCLAIMER);
    expect(reportRes.body.creator_quoted_claim.label).toBe("Creator's claim");
    expect(reportRes.body.creator_quoted_claim.target_price_claimed).toBe(740);
  });

  it("serves meta benchmarks, demo cases, and snapshot provenance endpoints", async () => {
    const [benchRes, demoRes, snapRes] = await Promise.all([
      request(app).get("/api/meta/benchmarks"),
      request(app).get("/api/meta/demo-cases"),
      request(app).get("/api/meta/snapshots"),
    ]);

    expect(benchRes.status).toBe(200);
    expect(benchRes.body.benchmarks).toHaveLength(3);
    expect(demoRes.status).toBe(200);
    expect(demoRes.body.items).toHaveLength(6);
    expect(snapRes.status).toBe(200);
    expect(snapRes.body.snapshots.length).toBeGreaterThanOrEqual(6);
  });
});
