import { revalidatePath } from "next/cache";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getAuthedUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const file = await prisma.file.create({
    data: {
      taskId,
      name: uploaded.name,
      contentType: uploaded.type || "application/octet-stream",
      data,
      uploadedById: user.id,
    },
    select: { id: true, name: true, contentType: true },
  });

  revalidatePath(`/tasks/${taskId}`);
  return Response.json({ file });
}