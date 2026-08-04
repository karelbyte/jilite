import { revalidatePath } from "next/cache";
import { getAuthedUser, isViewerOf } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { saveUpload, resolvePublicUrl } from "@/lib/uploads";
import { logger, requestIdFrom } from "@/lib/logger";

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const started = Date.now();
  const user = await getAuthedUser();
  if (!user) {
    logger.warn("upload.unauthorized", { requestId });
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const taskId = formData.get("taskId");
    const uploaded = formData.get("file");

    if (typeof taskId !== "string") {
      return Response.json({ error: "Task required" }, { status: 400 });
    }

    if (!(uploaded instanceof File)) {
      return Response.json({ error: "File required" }, { status: 400 });
    }

    if (uploaded.size > MAX_SIZE) {
      return Response.json({ error: "File too large" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    if (await isViewerOf(user, task.projectId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role !== "ADMIN") {
      const project = await prisma.project.findUnique({ where: { id: task.projectId } });
      const isOwner = project?.createdById === user.id;
      const membership =
        project &&
        (await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: project.id, userId: user.id } },
        }));
      if (!project || (!isOwner && !membership)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const data = Buffer.from(await uploaded.arrayBuffer());
    const filename = await saveUpload(data, uploaded.name);

    const file = await prisma.file.create({
      data: {
        taskId,
        name: uploaded.name,
        filename,
        contentType: uploaded.type || "application/octet-stream",
        uploadedById: user.id,
      },
      select: { id: true, name: true, filename: true, contentType: true },
    });

    logger.info("upload.completed", {
      requestId,
      userId: user.id,
      taskId,
      fileId: file.id,
      name: uploaded.name,
      bytes: data.length,
      durationMs: Date.now() - started,
    });

    revalidatePath(`/tasks/${taskId}`);
    return Response.json({ file, url: resolvePublicUrl(file.filename) });
  } catch (error) {
    logger.error("upload.error", {
      requestId,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
