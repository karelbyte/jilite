import { notFound } from "next/navigation";
import { requireUser, getProjectAccess, getAssignableUsers } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import TaskDetailTemplate from "@/templates/TaskDetail";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { createdById: true } },
      assignee: { select: { name: true, image: true } },
      createdBy: { select: { name: true, image: true } },
      comments: {
        include: { author: { select: { name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      files: { select: { id: true, name: true, contentType: true } },
      labels: {
        include: { label: { select: { id: true, name: true, color: true } } },
      },
      subtasks: { select: { id: true, title: true, done: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!task) notFound();

  const access = await getProjectAccess(user, task.projectId);
  if (!access.project || access.access === null) notFound();
  const canManage = access.access === "manage";

  const isOwner = task.createdById === user.id;
  const isAssignee = task.assigneeId === user.id;

  const canEditFull = canManage || isOwner;
  const statusOnly = !canEditFull && (isOwner || isAssignee);

  const users = await getAssignableUsers(task.projectId);

  const allLabels = await prisma.label.findMany({
    where: { projectId: task.projectId },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <TaskDetailTemplate
      task={{
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        createdBy: task.createdBy,
        assignee: task.assignee,
      }}
      comments={task.comments}
      files={task.files}
      labels={task.labels.map(({ label }) => label)}
      allLabels={allLabels}
      subtasks={task.subtasks}
      canManageLabels={canManage}
      users={users}
      canEditFull={canEditFull}
      statusOnly={statusOnly}
    />
  );
}