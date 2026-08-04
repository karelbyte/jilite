import "server-only";

const hits = new Map<string, number[]>();

const MINUTE = 60_000;

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs?: number } = { limit: 5 }
): { allowed: boolean; retryAfterMs?: number } {
  const windowMs = opts.windowMs ?? MINUTE;
  const now = Date.now();

  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= opts.limit) {
    const oldest = recent[0];
    const retryAfterMs = Math.max(0, windowMs - (now - oldest));
    hits.set(key, recent);
    return { allowed: false, retryAfterMs };
  }

  recent.push(now);
  hits.set(key, recent);
  return { allowed: true };
}

export function secondsUntil(retryAfterMs?: number): number {
  return retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 0;
}

export function rateLimitResponse(retryAfterMs?: number): Response {
  return new Response(JSON.stringify({ error: "Demasiadas peticiones. Intentá de nuevo en un momento." }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(secondsUntil(retryAfterMs)),
    },
  });
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}