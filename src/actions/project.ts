"use server";

import { revalidatePath } from "next/cache";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { deleteUploads } from "@/lib/uploads";
import { projectSchema, projectRoleSchema } from "@/lib/validations";
import type { ProjectRole } from "@/generated/prisma/client";

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

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<{ error: string | null }> {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Proyecto no encontrado" };

  if (user.role !== "ADMIN" && project.createdById !== user.id) {
    return { error: "No tienes permiso para cambiar roles" };
  }

  if (userId === project.createdById) {
    return { error: "No se puede cambiar el rol del dueño del proyecto" };
  }

  const parsed = projectRoleSchema.safeParse(role);
  if (!parsed.success) return { error: "Rol inválido" };

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) return { error: "El usuario no es miembro del proyecto" };

  await prisma.projectMember.update({
    where: { id: member.id },
    data: { role: parsed.data },
  });

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function deleteProject(projectId: string): Promise<{ error: string | null }> {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Proyecto no encontrado" };

  if (user.role !== "ADMIN" && project.createdById !== user.id) {
    return { error: "No tienes permiso para eliminar este proyecto" };
  }

  const taskCount = await prisma.task.count({ where: { projectId } });
  if (taskCount > 0) {
    return { error: `No se puede eliminar: el proyecto tiene ${taskCount} tarea(s). Eliminalas primero.` };
  }

  const projectFiles = await prisma.file.findMany({
    where: { OR: [{ task: { projectId } }, { projectId }] },
    select: { filename: true },
  });

  await prisma.project.delete({ where: { id: projectId } });

  await deleteUploads(projectFiles.map((f) => f.filename));

  revalidatePath("/dashboard");
  return { error: null };
}