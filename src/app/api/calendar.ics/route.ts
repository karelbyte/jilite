import { getAuthedUser, getVisibleProjectIds } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const projectIds = await getVisibleProjectIds(user);
  if (projectIds.length === 0) {
    return new Response(emptyIcs(), {
      headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: { in: projectIds }, dueDate: { not: null } },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      status: true,
      project: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jilite//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Jilite - Tareas",
  ];

  const now = new Date();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const dtStart = formatDate(t.dueDate);
    const end = new Date(t.dueDate.getTime() + 60 * 60 * 1000);
    const dtEnd = formatDate(end);
    const uid = `task-${t.id}@jilite`;
    const status = t.status === "DONE" ? "COMPLETED" : t.status === "IN_PROGRESS" ? "IN-PROCESS" : "CONFIRMED";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeText(t.title)}`,
      t.description ? `DESCRIPTION:${escapeText(t.description)}` : "",
      `LOCATION:${escapeText(t.project?.name ?? "")}`,
      `STATUS:${status}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  const body = lines.filter((l) => l !== "").join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"jilite.ics\"",
      "Cache-Control": "no-store",
    },
  });
}

function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00Z`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

function emptyIcs(): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jilite//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    "TZID:UTC",
    "END:VTIMEZONE",
    "END:VCALENDAR",
  ].join("\r\n");
}
