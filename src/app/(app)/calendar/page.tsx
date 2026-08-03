import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import CalendarTemplate, { type CalendarTask } from "@/templates/CalendarTemplate";
import type { Prisma } from "@/generated/prisma/client";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);

  const now = new Date();
  const year = clamp(Number(sp.y ?? now.getFullYear()), 2000, 2100);
  const month = clamp(Number(sp.m ?? now.getMonth() + 1), 1, 12);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const where: Prisma.TaskWhereInput = { dueDate: { gte: start, lt: end } };
  if (user.role !== "ADMIN") {
    where.OR = [
      { createdById: user.id },
      { assigneeId: user.id },
      { project: { createdById: user.id } },
      { project: { members: { some: { userId: user.id } } } },
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      project: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const tasksByDay: Record<number, CalendarTask[]> = {};
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const day = startOfDay(t.dueDate).getDate();
    (tasksByDay[day] ??= []).push({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      projectName: t.project.name,
    });
  }

  const firstDay = firstWeekdayOffset(start);
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: firstDay }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <CalendarTemplate
      year={year}
      month={month}
      weeks={weeks}
      tasksByDay={tasksByDay}
    />
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function firstWeekdayOffset(date: Date) {
  const dow = date.getDay(); // 0=Dom
  return (dow + 6) % 7; // lunes = 0
}