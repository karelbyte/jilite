import { redirect } from "next/navigation";
import { requireUser, getProjectAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import ProjectDetailTemplate from "@/templates/ProjectDetail";
import type { Prisma, Status } from "@/generated/prisma/client";

const PER_PAGE = 12;

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser();

  const access = await getProjectAccess(user, id);
  if (!access.project || access.access === null) redirect("/dashboard");
  const canManage = access.access === "manage";

  const page = Math.max(1, Number(sp.page ?? 1));
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const status: Status | "ALL" =
    sp.status === "TODO" || sp.status === "IN_PROGRESS" || sp.status === "DONE"
      ? sp.status
      : "ALL";

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true, status: true } },
        },
      },
    },
  });

  if (!project) redirect("/dashboard");

  const taskWhere: Prisma.TaskWhereInput = {
    projectId: id,
    ...(status !== "ALL" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where: taskWhere,
      include: {
        assignee: { select: { name: true, image: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.task.count({ where: taskWhere }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const activeMembers = project.members.filter((m) => m.user.status === "ACTIVE");
  const assignableUsers = activeMembers.map((m) => ({ id: m.user.id, name: m.user.name }));
  const memberIds = project.members.map((m) => m.userId);

  const availableUsers = canManage
    ? await prisma.user.findMany({
        where: { status: "ACTIVE", id: { notIn: memberIds } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const mappedTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    commentsCount: t._count.comments,
    dueDate: t.dueDate,
    assignee: t.assignee,
    canDelete: canManage || (user.role === "USER" && t.createdById === user.id),
  }));

  const members = project.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
    },
  }));

  return (
    <ProjectDetailTemplate
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        createdBy: project.createdBy,
      }}
      tasks={mappedTasks}
      members={members}
      availableUsers={availableUsers}
      assignableUsers={assignableUsers}
      canManage={canManage}
      search={search}
      status={status}
      page={page}
      totalPages={totalPages}
    />
  );
}