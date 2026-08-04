import { readFile } from "fs/promises";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { resolveFilePath } from "@/lib/uploads";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) {
    return new Response(null, { status: 401 });
  }

  const { id } = await ctx.params;

  const file = await prisma.file.findUnique({
    where: { id },
    include: { task: { select: { projectId: true } } },
  });
  if (!file) {
    return new Response(null, { status: 404 });
  }

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
      return new Response(null, { status: 404 });
    }
  }

  if (!file.filename) {
    return new Response(null, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(resolveFilePath(file.filename));
  } catch {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}