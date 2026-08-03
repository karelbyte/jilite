"use server";

import { revalidatePath } from "next/cache";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations";

export interface ActionState {
  error: string | null;
  id: string | null;
}

export async function createProject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado", id: null };
  if (user.role !== "ADMIN" && user.role !== "PROJECT_ADMIN") {
    return { error: "Solo los administradores pueden crear proyectos", id: null };
  }

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message, id: null };

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      createdById: user.id,
      members: { create: [{ userId: user.id }] },
    },
  });

  revalidatePath("/dashboard");
  return { error: null, id: project.id };
}

export async function addProjectMember(projectId: string, formData: FormData) {
  const user = await getAuthedUser();
  if (!user) return;

  const userId = formData.get("userId");
  if (typeof userId !== "string") return;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  if (user.role !== "ADMIN" && project.createdById !== user.id) return;

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.status !== "ACTIVE") return;

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId },
    update: {},
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectMember(projectId: string, userId: string) {
  const user = await getAuthedUser();
  if (!user) return;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  if (user.role !== "ADMIN" && project.createdById !== user.id) return;
  if (userId === user.id) return;

  await prisma.projectMember.deleteMany({ where: { projectId, userId } });

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const user = await getAuthedUser();
  if (!user) return;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  if (user.role !== "ADMIN" && project.createdById !== user.id) return;

  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/dashboard");
}