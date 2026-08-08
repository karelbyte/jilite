import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logger, requestIdFrom } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const started = Date.now();
  const user = await getAuthedUser();
  if (!user) return new Response(null, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ tasks: [], projects: [], users: [], files: [] });

  const accessible =
    user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { createdById: user.id },
            { assigneeId: user.id },
            { project: { createdById: user.id } },
            { project: { members: { some: { userId: user.id } } } },
          ],
        };

  const [tasks, projects, users, files] = await Promise.all([
    prisma.task.findMany({
      where: { title: { contains: q, mode: "insensitive" }, ...accessible },
      include: { project: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.project.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        ...(user.role === "ADMIN"
          ? {}
          : { OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] }),
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, name: true, email: true, image: true },
      orderBy: { name: "asc" },
      take: 5,
    }),
    prisma.file.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        ...(user.role === "ADMIN"
          ? {}
          : {
              OR: [
                { task: accessible },
                { project: { createdById: user.id } },
                { project: { members: { some: { userId: user.id } } } },
              ],
            }),
      },
      include: {
        task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  logger.info("search.completed", {
    requestId: requestIdFrom(request),
    userId: user.id,
    q,
    tasks: tasks.length,
    projects: projects.length,
    users: users.length,
    files: files.length,
    durationMs: Date.now() - started,
  });

  return Response.json({
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      projectName: t.project.name,
    })),
    projects: projects.map((p) => ({ id: p.id, name: p.name })),
    users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, image: u.image })),
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      taskId: f.task?.id ?? null,
      taskTitle: f.task?.title ?? null,
      projectId: f.project?.id ?? f.task?.project.id,
      projectName: f.project?.name ?? f.task?.project.name ?? "",
    })),
  });
}
