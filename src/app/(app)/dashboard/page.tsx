import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import ProjectsTemplate from "@/templates/Projects";
import type { Prisma } from "@/generated/prisma/client";

const PER_PAGE = 12;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);

  const page = Math.max(1, Number(sp.page ?? 1));

  let where: Prisma.ProjectWhereInput = {};
  if (user.role === "PROJECT_ADMIN") {
    where = { OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] };
  } else if (user.role === "USER") {
    where = { members: { some: { userId: user.id } } };
  }

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      include: {
        createdBy: { select: { name: true, image: true } },
        _count: { select: { members: true, tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.project.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const mapped = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    memberCount: p._count.members,
    taskCount: p._count.tasks,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
  }));

  const canCreate = user.role === "ADMIN" || user.role === "PROJECT_ADMIN";

  return (
    <ProjectsTemplate
      projects={mapped}
      canCreate={canCreate}
      page={page}
      totalPages={totalPages}
    />
  );
}