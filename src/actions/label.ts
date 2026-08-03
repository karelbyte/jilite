"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export async function createLabel(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();

  if (!name) return { error: "El nombre de la etiqueta es obligatorio" };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Proyecto no encontrado" };

  if (user.role !== "ADMIN" && user.role !== "PROJECT_ADMIN" && project.createdById !== user.id) {
    return { error: "No tienes permisos para crear etiquetas" };
  }

  const usedColors = await prisma.label.findMany({
    where: { projectId },
    select: { color: true },
  });
  const taken = new Set(usedColors.map((l) => l.color));
  const color = LABEL_COLORS.find((c) => !taken.has(c)) ?? `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;

  await prisma.label.create({ data: { name, color, projectId } });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function toggleTaskLabel(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "");
  const labelId = String(formData.get("labelId") || "");

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Tarea no encontrada" };

  const canEdit =
    user.role === "ADMIN" ||
    task.createdById === user.id ||
    task.assigneeId === user.id ||
    (user.role === "PROJECT_ADMIN" && task.projectId !== null);

  if (!canEdit) return { error: "No tienes permisos para editar esta tarea" };

  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId, labelId } },
  });

  if (existing) {
    await prisma.taskLabel.delete({ where: { taskId_labelId: { taskId, labelId } } });
  } else {
    const label = await prisma.label.findUnique({ where: { id: labelId } });
    if (!label) return { error: "Etiqueta no encontrada" };
    await prisma.taskLabel.create({ data: { taskId, labelId } });
  }

  revalidatePath(`/tasks/${taskId}`);
  return { ok: true };
}