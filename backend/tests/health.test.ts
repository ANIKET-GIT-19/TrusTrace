import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/core/env.js";
import { redactLogFields } from "../src/core/logger.js";

describe("Tip Autopsy backend baseline", () => {
  const testConfig = loadEnv({
    APP_ENV: "test",
    NODE_ENV: "test",
    PORT: "8000",
    FRONTEND_ORIGINS: "http://localhost:5173",
  });

  it("responds cleanly on GET /api/health without exposing secrets", async () => {
    const app = createApp({
      config: testConfig,
      probeDb: async () => ({ status: "connected", baselineVersion: "1.0-mern-supabase" }),
    });

    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toMatch(/^req_/);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("tip-autopsy-api");
    expect(response.body.checks).toEqual({
      database: "connected",
      schema_baseline: "1.0-mern-supabase",
      parser_provider: "disabled",
      voice_provider: "disabled",
    });
    expect(JSON.stringify(response.body)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("returns the standard API error envelope on unknown routes", async () => {
    const app = createApp({
      config: testConfig,
      probeDb: async () => ({ status: "not_configured", baselineVersion: null }),
    });

    const response = await request(app)
      .get("/api/does-not-exist")
      .set("x-request-id", "req_custom_12345");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "The requested API endpoint does not exist.",
        request_id: "req_custom_12345",
        retryable: false,
      },
    });
  });

  it("redacts sensitive user tips, media buffers, and secrets in structured logs", () => {
    const cleaned = redactLogFields({
      request_id: "req_abc12345",
      text: "Guaranteed 10x buy now!",
      file: Buffer.from("secret-image-bytes"),
      authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig",
      pause_plan: { lose: "5000", exit: "120" },
      safe_metric: 42,
    });

    expect(cleaned).toEqual({
      request_id: "req_abc12345",
      text: "[REDACTED]",
      file: "[REDACTED]",
      authorization: "[REDACTED]",
      pause_plan: "[REDACTED]",
      safe_metric: 42,
    });
  });
});
