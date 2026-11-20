import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logInfo } from "../../core/logger.js";

const SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  const requestId =
    incoming && SAFE_REQUEST_ID_PATTERN.test(incoming)
      ? incoming
      : `req_${crypto.randomBytes(12).toString("hex")}`;

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const startedAt = Date.now();
  res.on("finish", () => {
    logInfo("http.request", {
      request_id: requestId,
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      duration_ms: Date.now() - startedAt,
    });
  });

  next();
}
