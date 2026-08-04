import { sendDueDateReminders } from "@/lib/reminders";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("Not configured", { status: 404 });
  }

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("key");
  const auth = request.headers.get("authorization");
  const fromBearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const token = fromQuery ?? fromBearer;

  if (token !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await sendDueDateReminders();
  return Response.json({ ok: true, ...result });
}
