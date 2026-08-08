import { revalidatePath } from "next/cache";
import { getAuthedUser } from "@/lib/rbac";
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
    const projectId = formData.get("projectId");
    const uploaded = formData.get("file");

    if (!(uploaded instanceof File)) {
      return Response.json({ error: "File required" }, { status: 400 });
    }

    if (uploaded.size > MAX_SIZE) {
      return Response.json({ error: "File too large" }, { status: 400 });
    }

    let targetProjectId: string | null = null;
    let targetTaskId: string | null = null;

    if (typeof taskId === "string" && taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return Response.json({ error: "Task not found" }, { status: 404 });
      }
      targetProjectId = task.projectId;
      targetTaskId = task.id;
    } else if (typeof projectId === "string" && projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }
      targetProjectId = project.id;
    } else {
      return Response.json({ error: "Task or project required" }, { status: 400 });
    }

    if (targetProjectId && !(await canAccessProject(user.id, targetProjectId))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = Buffer.from(await uploaded.arrayBuffer());
    const filename = await saveUpload(data, uploaded.name);

    const file = await prisma.file.create({
      data: {
        taskId: targetTaskId,
        projectId: targetTaskId ? null : targetProjectId,
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
      taskId: targetTaskId,
      projectId: targetProjectId,
      fileId: file.id,
      name: uploaded.name,
      bytes: data.length,
      durationMs: Date.now() - started,
    });

    if (targetTaskId) revalidatePath(`/tasks/${targetTaskId}`);
    if (targetProjectId) revalidatePath(`/projects/${targetProjectId}`);
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

async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return false;
  if (user.role === "ADMIN") return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });
  if (!project) return false;
  if (project.createdById === user.id) return true;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  return membership ? membership.role !== "VIEWER" : false;
}
