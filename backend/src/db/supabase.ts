import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppEnv } from "../core/env.js";

export type DatabaseReadiness = "connected" | "not_configured" | "degraded";

export interface DatabaseProbeResult {
  status: DatabaseReadiness;
  baselineVersion: string | null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(config: AppEnv): SupabaseClient | null {
  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return cachedClient;
}

export async function probeDatabaseReadiness(config: AppEnv): Promise<DatabaseProbeResult> {
  const client = getSupabaseAdminClient(config);
  if (!client) {
    return { status: "not_configured", baselineVersion: null };
  }

  try {
    const { data, error } = await client
      .from("schema_metadata")
      .select("blueprint_version")
      .eq("id", "baseline-v1")
      .maybeSingle();

    if (error) {
      return { status: "degraded", baselineVersion: null };
    }

    const version =
      data && typeof data.blueprint_version === "string" ? data.blueprint_version : null;
    return { status: "connected", baselineVersion: version };
  } catch {
    return { status: "degraded", baselineVersion: null };
  }
}
