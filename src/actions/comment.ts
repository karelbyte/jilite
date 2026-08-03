"use server";

import { revalidatePath } from "next/cache";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendCommentNotification } from "@/lib/email";
import { commentSchema } from "@/lib/validations";

export interface ActionState {
  error: string | null;
}

export async function createComment(_prev: ActionState, formData: FormData) {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const taskId = formData.get("taskId");
  if (typeof taskId !== "string") return { error: "Tarea inválida" };

  const parsed = commentSchema.safeParse({
    body: formData.get("body"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, email: true, name: true } },
      createdBy: { select: { id: true, email: true, name: true } },
      comments: {
        include: { author: { select: { id: true, email: true, name: true } } },
      },
    },
  });

  if (!task) return { error: "Tarea no encontrada" };

  if (user.role !== "ADMIN") {
    const project = await prisma.project.findUnique({ where: { id: task.projectId } });
    const isOwner = project?.createdById === user.id;
    const membership =
      project && (await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
      }));
    if (!project || (!isOwner && !membership)) {
      return { error: "No tienes acceso a esta tarea" };
    }
  }

  const author = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true },
  });
  if (!author) return { error: "Usuario no encontrado" };

  await prisma.comment.create({
    data: {
      taskId,
      authorId: user.id,
      body: parsed.data.body,
    },
  });

  const recipients = new Map<string, { email: string; name: string }>();
  const add = (u: { id: string; email: string; name: string } | null) => {
    if (u && u.id !== user.id) recipients.set(u.email, u);
  };
  add(task.assignee);
  add(task.createdBy);
  task.comments.forEach((c) => add(c.author));

  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${taskId}`;

  await Promise.allSettled(
    [...recipients.values()].map((r) =>
      sendCommentNotification(r.email, {
        taskTitle: task.title,
        commenterName: author.name,
        commentBody: parsed.data.body,
        taskUrl,
      })
    )
  );

  revalidatePath(`/tasks/${taskId}`);
  return { error: null };
}

export async function deleteFile(fileId: string) {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado" };

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { task: { select: { projectId: true, createdById: true } } },
  });
  if (!file) return { error: "Archivo no encontrado" };

  if (user.role !== "ADMIN") {
    const project = await prisma.project.findUnique({
      where: { id: file.task.projectId },
    });
    const isOwner = project?.createdById === user.id;
    const membership =
      project &&
      (await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
      }));
    if (!project || (!isOwner && !membership)) {
      return { error: "No tienes acceso a este archivo" };
    }
  }

  await prisma.file.delete({ where: { id: fileId } });

  revalidatePath(`/tasks/${file.taskId}`);
  return { error: null };
}