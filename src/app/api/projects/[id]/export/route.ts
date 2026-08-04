import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { CSV_HEADERS, escapeCsv } from "@/lib/csv";
import { logger, requestIdFrom } from "@/lib/logger";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const started = Date.now();
  const user = await getAuthedUser();
  if (!user) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return new Response(null, { status: 404 });

  if (user.role !== "ADMIN") {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user.id } },
    });
    if (project.createdById !== user.id && !membership) {
      return new Response(null, { status: 404 });
    }
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    include: {
      assignee: { select: { email: true } },
      labels: { include: { label: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = [
    CSV_HEADERS.join(","),
    ...tasks.map((t) =>
      [
        escapeCsv(t.title),
        escapeCsv(t.description),
        t.status,
        t.priority,
        t.dueDate ? `${t.dueDate.getFullYear()}-${String(t.dueDate.getMonth() + 1).padStart(2, "0")}-${String(t.dueDate.getDate()).padStart(2, "0")}` : "",
        escapeCsv(t.assignee?.email ?? ""),
        escapeCsv(t.labels.map((l) => l.label.name).join(";")),
        t.recurrence ?? "",
      ].join(",")
    ),
  ];

  logger.info("csv.export.completed", {
    requestId: requestIdFrom(request),
    userId: user.id,
    projectId: id,
    rows: tasks.length,
    durationMs: Date.now() - started,
  });

  return new Response(rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(project.name)}-tareas.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
