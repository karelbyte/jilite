import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rateLimit";
import { logger, requestIdFrom } from "@/lib/logger";

export async function GET(request: Request) {
  const rl = checkRateLimit(`health:${clientIp(request)}`, { limit: 20 });
  if (!rl.allowed) {
    logger.warn("health.rate_limited", { requestId: requestIdFrom(request), ip: clientIp(request) });
    return rateLimitResponse(rl.retryAfterMs);
  }

  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("health.ok", { requestId: requestIdFrom(request), latencyMs: Date.now() - started });
    return Response.json({
      status: "ok",
      database: "ok",
      uptime: process.uptime(),
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("health.db_error", {
      requestId: requestIdFrom(request),
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      {
        status: "error",
        database: "unreachable",
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
