import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    ["name", "email", "role", "status", "createdAt"].join(","),
    ...users.map((u) =>
      [esc(u.name), esc(u.email), u.role, u.status, u.createdAt.toISOString()].join(",")
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="usuarios.csv"',
    },
  });
}