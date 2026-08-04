import "server-only";

type Level = "debug" | "info" | "warn" | "error";

interface LogFields {
  [key: string]: string | number | boolean | null | undefined;
}

function write(level: Level, msg: string, fields: LogFields = {}) {
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...fields,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (msg: string, fields?: LogFields) => write("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => write("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => write("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => write("error", msg, fields),
};

export function requestIdFrom(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export async function logRequest(request: Request, status: number, fields: LogFields = {}) {
  const url = new URL(request.url);
  logger.info("http.request", {
    requestId: requestIdFrom(request),
    method: request.method,
    path: url.pathname,
    query: url.search || undefined,
    status,
    durationMs: fields.durationMs ?? undefined,
    ...fields,
  });
}
