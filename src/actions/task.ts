"use server";

import { revalidatePath } from "next/cache";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendTaskAssignedEmail, sendTaskUpdatedEmail, TaskFieldChange } from "@/lib/email";
import { postWebhook } from "@/lib/notify";
import { logActivity } from "@/lib/activity";
import { statusSchema, prioritySchema, taskSchema } from "@/lib/validations";
import type { Priority, Status } from "@/generated/prisma/client";

export interface ActionState {
  error: string | null;
}

async function canCreateTaskIn(userId: string, role: string, project: { id: string; createdById: string }) {
  if (role === "ADMIN") return true;
  if (role === "PROJECT_ADMIN" && project.createdById === userId) return true;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId } },
  });
  return !!membership;
}

async function notifyAssignee(assigneeId: string | undefined, projectName: string, taskId: string, taskTitle: string) {
  if (!assigneeId) return;
  try {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { email: true, name: true, status: true },
    });
    if (!assignee || assignee.status !== "ACTIVE") return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendTaskAssignedEmail(assignee.email, {
      name: assignee.name,
      taskTitle,
      projectName,
      taskUrl: `${appUrl}/tasks/${taskId}`,
    });
  } catch (error) {
    console.error("No se pudo enviar la notificación de asignación:", error);
  }
}

interface NotifyTaskRecipientsInput {
  taskId: string;
  taskTitle: string;
  projectName: string;
  changes: TaskFieldChange[];
  editorId: string;
  editorName: string;
  projectId: string;
  creatorId: string;
  assigneeId: string | null;
}

async function notifyTaskRecipients(input: NotifyTaskRecipientsInput) {
  const { taskId, taskTitle, projectName, changes, editorId, editorName, projectId, creatorId, assigneeId } =
    input;

  if (changes.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const taskUrl = `${appUrl}/tasks/${taskId}`;

  const excludedIds = new Set<string>([editorId, assigneeId].filter(Boolean) as string[]);

  const [creator, projectMembers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true, name: true, email: true, status: true },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      select: {
        userId: true,
        user: { select: { id: true, name: true, email: true, status: true } },
      },
    }),
  ]);

  const recipients = new Map<string, { email: string; name: string }>();
  const add = (u: { id: string; email: string; name: string; status: string } | null | undefined) => {
    if (u && u.email && u.status === "ACTIVE" && !excludedIds.has(u.id)) {
      recipients.set(u.email, { email: u.email, name: u.name });
    }
  };

  add(creator);
  projectMembers.forEach((m) => add(m.user));

  await Promise.allSettled(
    [...recipients.values()].map((r) =>
      sendTaskUpdatedEmail(r.email, {
        name: r.name,
        taskTitle,
        projectName,
        changes,
        editorName,
        taskUrl,
      })
    )
  );
}

export async function createTask(_prev: ActionState, formData: FormData) {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string") return { error: "Proyecto inválido" };

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "TODO",
    priority: formData.get("priority") || "MEDIUM",
    assigneeId: formData.get("assigneeId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Proyecto no encontrado" };

  if (!(await canCreateTaskIn(user.id, user.role, project))) {
    return { error: "No tienes acceso a este proyecto" };
  }

  const { title, description, status, priority, assigneeId, dueDate } = parsed.data;

  if (assigneeId) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
    });
    if (!member) return { error: "El asignado no pertenece al proyecto" };
  }

  const created = await prisma.task.create({
    data: {
      title,
      description: description || null,
      status,
      priority,
      projectId,
      assigneeId: assigneeId || null,
      createdById: user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  await notifyAssignee(assigneeId, project.name, created.id, title);
  await postWebhook({
    text: `📝 **${user.name ?? user.email}** creó la tarea "${title}" en "${project.name}"`,
    taskUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${created.id}`,
  });
  await logActivity({
    action: "task.created",
    entity: "task",
    entityId: created.id,
    detail: title,
    actorId: user.id,
  });
  return { error: null };
}

export async function updateTask(_prev: ActionState, formData: FormData) {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Tarea inválida" };

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    priority: formData.get("priority"),
    assigneeId: formData.get("assigneeId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return { error: "Tarea no encontrada" };

  if (user.role === "ADMIN") {
    // full access
  } else if (user.role === "PROJECT_ADMIN" && task.projectId) {
    const project = await prisma.project.findUnique({ where: { id: task.projectId } });
    if (!project || project.createdById !== user.id) {
      return { error: "No tienes permisos para editar esta tarea" };
    }
  } else {
    if (task.createdById !== user.id && task.assigneeId !== user.id) {
      return { error: "No tienes permisos para editar esta tarea" };
    }
    if (task.createdById !== user.id) {
      const { title, description, priority, assigneeId } = parsed.data;
      const unchanged =
        task.title === title &&
        (task.description ?? null) === (description || null) &&
        task.priority === priority &&
        task.assigneeId === (assigneeId || null);
      if (!unchanged) return { error: "Solo puedes cambiar el estado de esta tarea" };
    }
  }

  const { title, description, status, priority, assigneeId, dueDate } = parsed.data;

  if (assigneeId && assigneeId !== task.assigneeId) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: assigneeId } },
    });
    if (!member) return { error: "El asignado no pertenece al proyecto" };
  }

  const project = await prisma.project.findUnique({ where: { id: task.projectId } });
  const projectName = project?.name ?? "el proyecto";

  await prisma.task.update({
    where: { id },
    data: {
      title,
      description: description || null,
      status,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/tasks/${id}`);

  if (assigneeId && assigneeId !== task.assigneeId) {
    await notifyAssignee(assigneeId, projectName, id, title);
  }

  const changes: TaskFieldChange[] = [];
  if (task.title !== title) {
    changes.push({ field: "title", label: "Título", from: task.title, to: title });
  }
  if ((task.description ?? null) !== (description || null)) {
    changes.push({
      field: "description",
      label: "Descripción",
      from: task.description,
      to: description || null,
    });
  }
  if (task.status !== status) {
    changes.push({ field: "status", label: "Estado", from: task.status, to: status });
  }
  if (task.priority !== priority) {
    changes.push({ field: "priority", label: "Prioridad", from: task.priority, to: priority });
  }
  if (task.dueDate && !dueDate) {
    changes.push({ field: "dueDate", label: "Fecha límite", from: task.dueDate.toISOString().split("T")[0], to: null });
  } else if (!task.dueDate && dueDate) {
    changes.push({
      field: "dueDate",
      label: "Fecha límite",
      from: null,
      to: new Date(dueDate).toISOString().split("T")[0],
    });
  } else if (task.dueDate && dueDate) {
    const prev = task.dueDate.toISOString().split("T")[0];
    const next = new Date(dueDate).toISOString().split("T")[0];
    if (prev !== next) {
      changes.push({ field: "dueDate", label: "Fecha límite", from: prev, to: next });
    }
  }

  await notifyTaskRecipients({
    taskId: id,
    taskTitle: title,
    projectName,
    changes,
    editorId: user.id,
    editorName: user.name ?? user.email,
    projectId: task.projectId,
    creatorId: task.createdById,
    assigneeId: assigneeId || null,
  });

  await postWebhook({
    text: `✏️ **${user.name ?? user.email}** actualizó "${title}" (${changes.map((c) => c.label).join(", ")}${changes.length === 0 ? "sin cambios" : ""})`,
    taskUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${id}`,
  });

  await logActivity({
    action: "task.updated",
    entity: "task",
    entityId: id,
    detail: title,
    actorId: user.id,
  });

  return { error: null };
}

export async function updateTaskStatus(_prev: ActionState, formData: FormData) {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Tarea inválida" };

  const parsed = statusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return { error: "Estado inválido" };

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      projectId: true,
      createdById: true,
      assigneeId: true,
      project: { select: { name: true } },
    },
  });
  if (!task) return { error: "Tarea no encontrada" };

  const canManage =
    user.role === "ADMIN" ||
    (user.role === "PROJECT_ADMIN" &&
      (await prisma.project.findUnique({ where: { id: task.projectId } }))?.createdById === user.id);

  if (!canManage && task.assigneeId !== user.id && task.createdById !== user.id) {
    return { error: "No tienes permisos para mover esta tarea" };
  }

  if (task.status === parsed.data) {
    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath(`/tasks/${id}`);
    return { error: null };
  }

  await prisma.task.update({ where: { id }, data: { status: parsed.data } });

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/tasks/${id}`);
  await logActivity({
    action: `task.status:${parsed.data}`,
    entity: "task",
    entityId: id,
    detail: task.title,
    actorId: user.id,
  });

  const projectName = task.project?.name ?? "el proyecto";
  const changes: TaskFieldChange[] = [
    { field: "status", label: "Estado", from: task.status, to: parsed.data },
  ];
  await notifyTaskRecipients({
    taskId: id,
    taskTitle: task.title,
    projectName,
    changes,
    editorId: user.id,
    editorName: user.name ?? user.email,
    projectId: task.projectId,
    creatorId: task.createdById,
    assigneeId: null,
  });

  await postWebhook({
    text: `🔀 **${user.name ?? user.email}** movió "${task.title}" a ${parsed.data}`,
    taskUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${id}`,
  });

  return { error: null };
}

export async function bulkUpdateTasks(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string") return { error: "Proyecto inválido" };

  const ids = formData.getAll("ids").filter((v): v is string => typeof v === "string" && v.length > 0);
  if (ids.length === 0) return { error: "Seleccioná al menos una tarea" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, createdById: true },
  });
  if (!project) return { error: "Proyecto no encontrado" };

  const canManage =
    user.role === "ADMIN" || (user.role === "PROJECT_ADMIN" && project.createdById === user.id);
  if (!canManage) return { error: "No tenés permiso para modificar tareas en este proyecto" };

  const tasks = await prisma.task.findMany({
    where: { id: { in: ids }, projectId },
    select: { id: true },
  });
  if (tasks.length !== ids.length) {
    return { error: "Algunas tareas no pertenecen a este proyecto" };
  }

  const data: { status?: Status; priority?: Priority; assigneeId?: string | null } = {};
  const status = formData.get("status");
  if (status && statusSchema.safeParse(status).success) data.status = status as Status;
  const priority = formData.get("priority");
  if (priority && prioritySchema.safeParse(priority).success) data.priority = priority as Priority;
  if (formData.get("assigneeId") !== null) {
    const assignee = formData.get("assigneeId");
    data.assigneeId = typeof assignee === "string" && assignee ? assignee : null;
  }

  if (Object.keys(data).length === 0) return { error: "No se especificaron cambios" };

  await prisma.task.updateMany({ where: { id: { in: ids }, projectId }, data });

  revalidatePath(`/projects/${projectId}`);
  await logActivity({
    action: "tasks.bulk_updated",
    entity: "task",
    entityId: projectId,
    detail: JSON.stringify(data),
    actorId: user.id,
  });
  return { error: null };
}

export async function bulkDeleteTasks(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string") return { error: "Proyecto inválido" };

  const ids = formData.getAll("ids").filter((v): v is string => typeof v === "string" && v.length > 0);
  if (ids.length === 0) return { error: "Seleccioná al menos una tarea" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });
  if (!project) return { error: "Proyecto no encontrado" };

  const canManage =
    user.role === "ADMIN" || (user.role === "PROJECT_ADMIN" && project.createdById === user.id);
  if (!canManage) return { error: "No tenés permiso para eliminar tareas en este proyecto" };

  await prisma.task.deleteMany({ where: { id: { in: ids }, projectId } });

  revalidatePath(`/projects/${projectId}`);
  await logActivity({
    action: "tasks.bulk_deleted",
    entity: "task",
    entityId: projectId,
    detail: ids.length.toString(),
    actorId: user.id,
  });
  return { error: null };
}

export async function deleteTask(id: string) {
  const user = await getAuthedUser();
  if (!user) return;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;

  if (user.role === "ADMIN") {
    // full access
  } else if (user.role === "PROJECT_ADMIN") {
    const project = await prisma.project.findUnique({ where: { id: task.projectId } });
    if (!project || project.createdById !== user.id) return;
  } else {
    if (task.createdById !== user.id) return;
  }

  await prisma.task.delete({ where: { id } });

  revalidatePath(`/projects/${task.projectId}`);
  await logActivity({
    action: "task.deleted",
    entity: "task",
    entityId: id,
    detail: task.title,
    actorId: user.id,
  });
}

export async function moveTask(id: string, status: string, position?: number): Promise<ActionState> {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Estado inválido" };

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return { error: "Tarea no encontrada" };

  const project = await prisma.project.findUnique({ where: { id: task.projectId } });
  const canManage =
    user.role === "ADMIN" || (user.role === "PROJECT_ADMIN" && project?.createdById === user.id);

  if (!canManage && task.assigneeId !== user.id && task.createdById !== user.id) {
    return { error: "No tienes permisos para mover esta tarea" };
  }

  await prisma.task.update({ where: { id }, data: { status: parsed.data } });

  if (typeof position === "number" && position >= 0) {
    await normalizePositions(task.projectId, parsed.data, id, position);
  }

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/tasks/${id}`);
  await logActivity({
    action: `task.status:${parsed.data}`,
    entity: "task",
    entityId: id,
    detail: task.title,
    actorId: user.id,
  });
  return { error: null };
}

async function normalizePositions(projectId: string, status: Status, movedId: string, targetIndex: number) {
  const siblings = await prisma.task.findMany({
    where: { projectId, status },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const without = siblings.filter((s) => s.id !== movedId);
  const clamped = Math.max(0, Math.min(targetIndex, without.length));
  without.splice(clamped, 0, { id: movedId });

  await Promise.all(
    without.map((s, i) => prisma.task.update({ where: { id: s.id }, data: { position: i } }))
  );
}