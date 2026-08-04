"use server";

import { revalidatePath } from "next/cache";
import { requireUser, isViewerOf } from "@/lib/rbac";
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

function validColor(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const hex = value.trim();
  if (/^#([0-9a-f]{6})$/i.test(hex)) return hex.toLowerCase();
  return null;
}

async function canManageLabels(
  user: { id: string; role: string },
  project: { id: string; createdById: string }
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role === "PROJECT_ADMIN" && project.createdById === user.id) return true;
  if (project.createdById === user.id) return true;
  return false;
}

async function nextColor(projectId: string): Promise<string> {
  const usedColors = await prisma.label.findMany({
    where: { projectId },
    select: { color: true },
  });
  const taken = new Set(usedColors.map((l) => l.color));
  return (
    LABEL_COLORS.find((c) => !taken.has(c)) ??
    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`
  );
}

export async function createLabel(formData: FormData): Promise<void> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();

  if (!name) return;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  if (!(await canManageLabels(user, project))) return;

  const color = validColor(formData.get("color")) ?? (await nextColor(projectId));

  await prisma.label.create({ data: { name, color, projectId } });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/tasks`);
}

export async function updateLabel(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();

  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) return;

  const project = await prisma.project.findUnique({ where: { id: label.projectId } });
  if (!project) return;

  if (!(await canManageLabels(user, project))) return;

  const color = validColor(formData.get("color"));
  await prisma.label.update({
    where: { id },
    data: { name: name || label.name, color: color ?? label.color },
  });

  revalidatePath(`/projects/${label.projectId}`);
  revalidatePath(`/tasks`);
}

export async function deleteLabel(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") || "");

  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) return;

  const project = await prisma.project.findUnique({ where: { id: label.projectId } });
  if (!project) return;

  if (!(await canManageLabels(user, project))) return;

  await prisma.label.delete({ where: { id } });

  revalidatePath(`/projects/${label.projectId}`);
  revalidatePath(`/tasks`);
}

export async function toggleTaskLabel(formData: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "");
  const labelId = String(formData.get("labelId") || "");

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  if (await isViewerOf(user, task.projectId)) return;

  const canEdit =
    user.role === "ADMIN" ||
    task.createdById === user.id ||
    task.assigneeId === user.id ||
    (user.role === "PROJECT_ADMIN" && task.projectId !== null);

  if (!canEdit) return;

  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId, labelId } },
  });

  if (existing) {
    await prisma.taskLabel.delete({ where: { taskId_labelId: { taskId, labelId } } });
  } else {
    const label = await prisma.label.findUnique({ where: { id: labelId } });
    if (!label) return;
    await prisma.taskLabel.create({ data: { taskId, labelId } });
  }

  revalidatePath(`/tasks/${taskId}`);
}
