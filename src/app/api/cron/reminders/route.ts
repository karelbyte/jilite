import { sendDueDateReminders } from "@/lib/reminders";
import { logger, requestIdFrom } from "@/lib/logger";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.warn("cron.reminders.not_configured", { requestId: requestIdFrom(request) });
    return new Response("Not configured", { status: 404 });
  }

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("key");
  const auth = request.headers.get("authorization");
  const fromBearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const token = fromQuery ?? fromBearer;

  if (token !== secret) {
    logger.warn("cron.reminders.unauthorized", { requestId: requestIdFrom(request) });
    return new Response("Unauthorized", { status: 401 });
  }

  const started = Date.now();
  const result = await sendDueDateReminders();
  logger.info("cron.reminders.completed", {
    requestId: requestIdFrom(request),
    sent: result.sent,
    overdue: result.overdue,
    errors: result.errors.length,
    firstError: result.errors[0],
    durationMs: Date.now() - started,
  });
  return Response.json({ ok: true, ...result });
}
