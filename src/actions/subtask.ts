"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { postWebhook } from "@/lib/notify";
import type { ActionState } from "@/actions/admin";

async function canEditTask(userId: string, role: string, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return null;
  const canEdit =
    role === "ADMIN" ||
    task.createdById === userId ||
    task.assigneeId === userId ||
    (role === "PROJECT_ADMIN" && task.projectId !== null);
  if (!canEdit) return null;
  return task;
}

export async function createSubtask(formData: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const task = await canEditTask(user.id, user.role, taskId);
  if (!task) return;

  await prisma.subtask.create({ data: { taskId, title } });
  revalidatePath(`/tasks/${taskId}`);

  await postWebhook({
    text: `📋 **${user.name}** añadió la subtarea "${title}" a "${task.title}"`,
    taskUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${taskId}`,
  });
}

export async function toggleSubtask(formData: FormData): Promise<void> {
  const user = await requireUser();
  const subtaskId = String(formData.get("subtaskId") || "");
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
  if (!subtask) return;

  const task = await canEditTask(user.id, user.role, subtask.taskId);
  if (!task) return;

  await prisma.subtask.update({
    where: { id: subtaskId },
    data: { done: !subtask.done },
  });
  revalidatePath(`/tasks/${subtask.taskId}`);

  await postWebhook({
    text: `${
      subtask.done ? "↩️" : "✅"
    } **${user.name}** ${subtask.done ? "marcó como pendiente" : "completó"} la subtarea "${subtask.title}" en "${task.title}"`,
    taskUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${subtask.taskId}`,
  });
}

export async function deleteSubtask(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const subtaskId = String(formData.get("subtaskId") || "");
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
  if (!subtask) return { error: "Subtarea no encontrada", message: null };

  const task = await canEditTask(user.id, user.role, subtask.taskId);
  if (!task) return { error: "No tienes permiso para eliminar esta subtarea", message: null };

  await prisma.subtask.delete({ where: { id: subtaskId } });
  revalidatePath(`/tasks/${subtask.taskId}`);
  await postWebhook({
    text: `🗑️ **${user.name}** eliminó la subtarea "${subtask.title}" de "${task.title}"`,
    taskUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${subtask.taskId}`,
  });
  return { error: null, message: "Subtarea eliminada" };
}