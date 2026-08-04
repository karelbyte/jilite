import { redirect } from "next/navigation";
import { requireUser, getProjectAccess, isViewerOf } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import ProjectDetailTemplate from "@/templates/ProjectDetail";
import type { Prisma, Priority, Status } from "@/generated/prisma/client";

const PER_PAGE = 12;

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    label?: string;
    tab?: string;
  }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser();

  const access = await getProjectAccess(user, id);
  if (!access.project || access.access === null) redirect("/dashboard");
  const canManage = access.access === "manage";
  const isViewer = await isViewerOf(user, id);

  const tab: "tareas" | "miembros" | "archivos" | "actividad" =
    sp.tab === "miembros" || sp.tab === "archivos" || sp.tab === "actividad" ? sp.tab : "tareas";

  const page = Math.max(1, Number(sp.page ?? 1));
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const status: Status | "ALL" =
    sp.status === "TODO" || sp.status === "IN_PROGRESS" || sp.status === "DONE"
      ? sp.status
      : "ALL";
  const priority: Priority | "ALL" =
    sp.priority === "LOW" || sp.priority === "MEDIUM" || sp.priority === "HIGH"
      ? sp.priority
      : "ALL";
  const assignee = typeof sp.assignee === "string" ? sp.assignee.trim() : "";
  const label = typeof sp.label === "string" ? sp.label.trim() : "";

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
    ...(priority !== "ALL" ? { priority } : {}),
    ...(assignee ? { assigneeId: assignee } : {}),
    ...(label ? { labels: { some: { labelId: label } } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const projectLabels = await prisma.label.findMany({
    where: { projectId: id },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  const savedViews = await prisma.savedView.findMany({
    where: { userId: user.id, projectId: id },
    select: { id: true, name: true, filters: true },
    orderBy: { createdAt: "asc" },
  });

  const projectFiles = await prisma.file.findMany({
    where: { task: { projectId: id } },
    include: {
      task: { select: { id: true, title: true } },
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const [projectTaskIds, projectInvitationIds] = await Promise.all([
    prisma.task.findMany({ where: { projectId: id }, select: { id: true } }),
    prisma.invitation.findMany({ where: { projectId: id }, select: { id: true } }),
  ]);

  const activity = await prisma.activityLog.findMany({
    where: {
      OR: [
        { entity: "task", entityId: { in: projectTaskIds.map((t) => t.id) } },
        { entity: "project", entityId: id },
        { entity: "invitation", entityId: { in: projectInvitationIds.map((i) => i.id) } },
      ],
    },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const [tasks, total] = await prisma.$transaction([    prisma.task.findMany({
      where: taskWhere,
      include: {
        assignee: { select: { name: true, image: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
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
    canDelete: canManage || (user.role === "USER" && !isViewer && t.createdById === user.id),
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
      canEdit={!isViewer}
      search={search}
      status={status}
      priority={priority}
      assignee={assignee}
      label={label}
      projectLabels={projectLabels}
      savedViews={savedViews}
      page={page}
      totalPages={totalPages}
      tab={tab}
      projectFiles={projectFiles}
      activity={activity}
    />
  );
}