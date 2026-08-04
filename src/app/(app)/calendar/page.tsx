import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import CalendarTemplate, { type CalendarTask } from "@/templates/CalendarTemplate";
import type { Prisma } from "@/generated/prisma/client";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; view?: string }>;
}) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);

  const now = new Date();
  const year = clamp(Number(sp.y ?? now.getFullYear()), 2000, 2100);
  const month = clamp(Number(sp.m ?? now.getMonth() + 1), 1, 12);
  const view = sp.view === "week" ? "week" : "month";

  const start = view === "week" ? mondayOfWeek(new Date(year, month - 1, 1)) : new Date(year, month - 1, 1);
  const end = view === "week" ? addDays(start, 7) : new Date(year, month, 1);

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

  const projects = await prisma.project.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : { OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const tasksByISO: Record<string, CalendarTask[]> = {};
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const key = iso(t.dueDate.getFullYear(), t.dueDate.getMonth() + 1, t.dueDate.getDate());
    (tasksByISO[key] ??= []).push({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      projectName: t.project.name,
    });
  }

  const weeks: (number | null)[][] = [];
  let weekDays: { iso: string; label: string }[] = [];

  if (view === "week") {
    weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      return { iso: iso(d.getFullYear(), d.getMonth() + 1, d.getDate()), label: String(d.getDate()) };
    });
  } else {
    const firstDay = firstWeekdayOffset(start);
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = Array.from({ length: firstDay }, () => null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  }

  return (
    <CalendarTemplate
      year={year}
      month={month}
      view={view}
      weeks={weeks}
      weekDays={weekDays}
      tasksByISO={tasksByISO}
      projects={projects}
    />
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function iso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function firstWeekdayOffset(date: Date) {
  const dow = date.getDay(); // 0=Dom
  return (dow + 6) % 7; // lunes = 0
}
function mondayOfWeek(date: Date) {
  const x = new Date(date);
  x.setHours(0, 0, 0, 0);
  const offset = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - offset);
  return x;
}
function addDays(date: Date, days: number) {
  const x = new Date(date);
  x.setDate(x.getDate() + days);
  return x;
}
