import { sendDigests } from "@/lib/digest";
import { logger, requestIdFrom } from "@/lib/logger";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.warn("cron.digest.not_configured", { requestId: requestIdFrom(request) });
    return new Response("Not configured", { status: 404 });
  }

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("key");
  const auth = request.headers.get("authorization");
  const fromBearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const token = fromQuery ?? fromBearer;

  if (token !== secret) {
    logger.warn("cron.digest.unauthorized", { requestId: requestIdFrom(request) });
    return new Response("Unauthorized", { status: 401 });
  }

  const period = url.searchParams.get("period") === "weekly" ? "weekly" : "daily";
  const started = Date.now();
  const result = await sendDigests(period);
  logger.info("cron.digest.completed", {
    requestId: requestIdFrom(request),
    period,
    sent: result.sent,
    durationMs: Date.now() - started,
  });
  return Response.json({ ok: true, ...result });
}
