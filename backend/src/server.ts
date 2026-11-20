import { createApp } from "./app.js";
import { env } from "./core/env.js";
import { logInfo } from "./core/logger.js";

const app = createApp({ config: env });

const server = app.listen(env.PORT, () => {
  logInfo("server.started", {
    port: env.PORT,
    app_env: env.APP_ENV,
    allowed_origins_count: env.FRONTEND_ORIGINS.length,
  });
});

function shutdown(signal: string): void {
  logInfo("server.shutdown", { signal });
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
