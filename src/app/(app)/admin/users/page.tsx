import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AdminUsersTemplate from "@/templates/AdminUsers";

const PER_PAGE = 15;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; role?: string; status?: string }>;
}) {
  const [admin, sp] = await Promise.all([requireAdmin(), searchParams]);

  const page = Math.max(1, Number(sp.page ?? 1));
  const query = sp.q?.trim() ?? "";
  const role = sp.role || undefined;
  const status = sp.status === "ACTIVE" || sp.status === "INACTIVE" ? sp.status : undefined;

  const where = {
    ...(query ? { name: { contains: query, mode: "insensitive" as const } } : {}),
    ...(role ? { role: role as "ADMIN" | "PROJECT_ADMIN" | "USER" } : {}),
    ...(status ? { status: status as "ACTIVE" | "INACTIVE" } : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <AdminUsersTemplate
      users={users}
      currentUserId={admin.id}
      page={page}
      totalPages={totalPages}
      query={query}
      role={sp.role ?? null}
      status={sp.status ?? null}
    />
  );
}