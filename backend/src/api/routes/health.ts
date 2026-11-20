import { Router } from "express";
import type { AppEnv } from "../../core/env.js";
import { probeDatabaseReadiness, type DatabaseProbeResult } from "../../db/supabase.js";

export interface HealthRouterOptions {
  config: AppEnv;
  probeDb?: (config: AppEnv) => Promise<DatabaseProbeResult>;
}

export function createHealthRouter({
  config,
  probeDb = probeDatabaseReadiness,
}: HealthRouterOptions): Router {
  const router = Router();

  router.get("/health", async (req, res) => {
    const db = await probeDb(config);
    const overallStatus = db.status === "degraded" ? "degraded" : "ok";

    res.status(200).json({
      status: overallStatus,
      service: "tip-autopsy-api",
      request_id: req.requestId ?? "req_unknown",
      timestamp: new Date().toISOString(),
      checks: {
        database: db.status,
        schema_baseline: db.baselineVersion,
        parser_provider: config.LLM_PROVIDER === "disabled" ? "disabled" : "configured",
        voice_provider: config.SARVAM_API_KEY ? "configured" : "disabled",
      },
    });
  });

  return router;
}
