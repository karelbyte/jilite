import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/organisms/KanbanBoard";
import BoardProjectFilter from "@/components/molecules/BoardProjectFilter";
import type { Prisma } from "@/generated/prisma/client";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);

  const projects = await prisma.project.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : { OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const filter = projects.some((p) => p.id === sp.p) ? sp.p : undefined;

  const where: Prisma.TaskWhereInput = filter
    ? { projectId: filter }
    : user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { createdById: user.id },
            { assigneeId: user.id },
            { project: { createdById: user.id } },
            { project: { members: { some: { userId: user.id } } } },
          ],
        };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { name: true, image: true } },
      project: { select: { name: true, id: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tablero global</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tareas de todos tus proyectos en una sola vista. Arrastra para cambiar el estado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BoardProjectFilter projects={projects} selected={filter} />
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Proyectos
          </Link>
        </div>
      </div>

      <KanbanBoard
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          position: t.position,
          commentsCount: t._count.comments,
          dueDate: t.dueDate,
          projectName: t.project.name,
          assignee: t.assignee,
          canDelete: false,
        }))}
        showProject
      />
    </div>
  );
}
