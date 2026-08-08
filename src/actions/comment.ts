"use server";

import { revalidatePath } from "next/cache";
import { getAuthedUser, isViewerOf } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { enqueueEmail, enqueueWebhook } from "@/lib/outbox";
import { commentSchema } from "@/lib/validations";
import { findMentionNames } from "@/lib/mentions";
import { createNotification } from "@/lib/notifications";
import { deleteUpload } from "@/lib/uploads";
import type { ActionState as AdminActionState } from "@/actions/admin";

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

  if (await isViewerOf(user, task.projectId)) {
    return { error: "No tienes permisos para comentar" };
  }

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

  const members = await prisma.projectMember.findMany({
    where: { projectId: task.projectId },
    include: { user: { select: { id: true, email: true, name: true, status: true } } },
  });

  const mentionNames = findMentionNames(parsed.data.body, members.map((m) => m.user.name));
  const mentionNameSet = new Set(mentionNames.map((n) => n.toLowerCase()));
  const mentionedIds = new Set<string>();
  for (const m of members) {
    if (mentionNameSet.has(m.user.name.toLowerCase())) mentionedIds.add(m.user.id);
  }

  const recipients = new Map<string, { id: string; email: string; name: string }>();
  const add = (u: { id: string; email: string; name: string } | null) => {
    if (u && u.id !== user.id) recipients.set(u.email, u);
  };
  add(task.assignee);
  add(task.createdBy);
  task.comments.forEach((c) => add(c.author));
  for (const m of members) {
    if (mentionedIds.has(m.user.id) && m.user.status === "ACTIVE") add(m.user);
  }

  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tasks/${taskId}`;

  await Promise.allSettled(
    [...recipients.values()].map((r) =>
      mentionedIds.has(r.id)
        ? enqueueEmail("mention", r.email, {
            taskTitle: task.title,
            mentionerName: author.name,
            commentBody: parsed.data.body,
            taskUrl,
          })
        : enqueueEmail("comment", r.email, {
            taskTitle: task.title,
            commenterName: author.name,
            commentBody: parsed.data.body,
            taskUrl,
          })
    )
  );

  const mentionedNames = members
    .filter((m) => mentionedIds.has(m.user.id))
    .map((m) => m.user.name)
    .join(", ");

  await Promise.allSettled(
    [...recipients.values()].map((r) =>
      createNotification({
        userId: r.id,
        type: mentionedIds.has(r.id) ? "mention" : "comment",
        title: mentionedIds.has(r.id)
          ? `Te mencionaron en "${task.title}"`
          : `Nuevo comentario en "${task.title}"`,
        body: `${author.name}: ${parsed.data.body.slice(0, 200)}`,
        taskId,
      })
    )
  );

  await enqueueWebhook(
    `💬 **${author.name}** comentó en "${task.title}"${
      mentionedNames ? ` y mencionó a: ${mentionedNames}` : ""
    }`,
    taskUrl
  );

  revalidatePath(`/tasks/${taskId}`);
  return { error: null };
}

export async function deleteFile(fileId: string): Promise<AdminActionState> {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado", message: null };

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      task: { select: { projectId: true, createdById: true } },
      project: { select: { id: true, createdById: true } },
    },
  });
  if (!file) return { error: "Archivo no encontrado", message: null };

  const projectId = file.projectId ?? file.task?.projectId;
  if (!projectId) return { error: "Archivo no encontrado", message: null };

  if (await isViewerOf(user, projectId)) {
    return { error: "No tienes permisos para eliminar archivos", message: null };
  }

  if (user.role !== "ADMIN") {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    const isOwner = project?.createdById === user.id;
    const membership =
      project &&
      (await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
      }));
    if (!project || (!isOwner && !membership)) {
      return { error: "No tienes acceso a este archivo", message: null };
    }
  }

  await prisma.file.delete({ where: { id: fileId } });
  await deleteUpload(file.filename);

  if (file.taskId) revalidatePath(`/tasks/${file.taskId}`);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, message: "Archivo eliminado" };
}