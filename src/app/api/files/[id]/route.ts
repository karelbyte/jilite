import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

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

  return new Response(Buffer.from(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}