import { readFile } from "fs/promises";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { resolveFilePath } from "@/lib/uploads";
import { logger, requestIdFrom } from "@/lib/logger";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const started = Date.now();
  const requestId = requestIdFrom(request);
  const user = await getAuthedUser();
  if (!user) {
    return new Response(null, { status: 401 });
  }

  const { id } = await ctx.params;

  const file = await prisma.file.findUnique({
    where: { id },
    include: {
      task: { select: { projectId: true } },
      project: { select: { id: true } },
    },
  });
  if (!file) {
    return new Response(null, { status: 404 });
  }

  const projectId = file.projectId ?? file.task?.projectId;
  if (!projectId) {
    return new Response(null, { status: 404 });
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
      return new Response(null, { status: 404 });
    }
  }

  if (!file.filename) {
    return new Response(null, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(resolveFilePath(file.filename));
  } catch (error) {
    logger.error("files.read_error", {
      requestId,
      fileId: id,
      filename: file.filename,
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(null, { status: 404 });
  }

  logger.info("files.completed", {
    requestId,
    fileId: id,
    userId: user.id,
    bytes: buffer.length,
    durationMs: Date.now() - started,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
