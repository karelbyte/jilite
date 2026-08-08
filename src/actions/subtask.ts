"use server";

import { revalidatePath } from "next/cache";
import { requireUser, isViewerOf, type AuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { enqueueWebhook } from "@/lib/outbox";
import type { ActionState } from "@/actions/admin";

async function canEditTask(user: AuthedUser, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return null;
  if (await isViewerOf(user, task.projectId)) return null;
  const canEdit =
    user.role === "ADMIN" ||
    task.createdById === user.id ||
    task.assigneeId === user.id ||
    (user.role === "PROJECT_ADMIN" && task.projectId !== null);
  if (!canEdit) return null;
  return task;
}

function parseEstimate(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const n = parseInt(String(value), 10);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export async function createSubtask(formData: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const task = await canEditTask(user, taskId);
  if (!task) return;

  const dueDateValue = formData.get("dueDate");
  const dueDate = typeof dueDateValue === "string" && dueDateValue ? new Date(dueDateValue) : null;
  const estimateMinutes = parseEstimate(formData.get("estimateMinutes"));

  const last = await prisma.subtask.findFirst({
    where: { taskId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.subtask.create({
    data: { taskId, title, dueDate, estimateMinutes, position: (last?.position ?? 0) + 1 },
  });
  revalidatePath(`/tasks/${taskId}`);

  await enqueueWebhook(
    `📋 **${user.name}** añadió la subtarea "${title}" a "${task.title}"`,
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${taskId}`
  );
}

export async function toggleSubtask(formData: FormData): Promise<void> {
  const user = await requireUser();
  const subtaskId = String(formData.get("subtaskId") || "");
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
  if (!subtask) return;

  const task = await canEditTask(user, subtask.taskId);
  if (!task) return;

  await prisma.subtask.update({
    where: { id: subtaskId },
    data: { done: !subtask.done },
  });
  revalidatePath(`/tasks/${subtask.taskId}`);

  await enqueueWebhook(
    `${
      subtask.done ? "↩️" : "✅"
    } **${user.name}** ${subtask.done ? "marcó como pendiente" : "completó"} la subtarea "${subtask.title}" en "${task.title}"`,
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${subtask.taskId}`
  );
}

export async function moveSubtask(formData: FormData): Promise<void> {
  const user = await requireUser();
  const subtaskId = String(formData.get("subtaskId") || "");
  const direction = formData.get("direction");
  if (direction !== "up" && direction !== "down") return;

  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
  if (!subtask) return;

  const task = await canEditTask(user, subtask.taskId);
  if (!task) return;

  const siblings = await prisma.subtask.findMany({
    where: { taskId: subtask.taskId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  const index = siblings.findIndex((s) => s.id === subtaskId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= siblings.length) return;

  const [a, b] = [siblings[index], siblings[swapIndex]];
  await prisma.$transaction([
    prisma.subtask.update({ where: { id: a.id }, data: { position: b.position } }),
    prisma.subtask.update({ where: { id: b.id }, data: { position: a.position } }),
  ]);

  revalidatePath(`/tasks/${subtask.taskId}`);
}

export async function deleteSubtask(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const subtaskId = String(formData.get("subtaskId") || "");
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
  if (!subtask) return { error: "Subtarea no encontrada", message: null };

  const task = await canEditTask(user, subtask.taskId);
  if (!task) return { error: "No tienes permiso para eliminar esta subtarea", message: null };

  await prisma.subtask.delete({ where: { id: subtaskId } });
  revalidatePath(`/tasks/${subtask.taskId}`);
  await enqueueWebhook(
    `🗑️ **${user.name}** eliminó la subtarea "${subtask.title}" de "${task.title}"`,
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${subtask.taskId}`
  );
  return { error: null, message: "Subtarea eliminada" };
}
