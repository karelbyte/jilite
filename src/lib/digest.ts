import "server-only";
import { subDays, addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendDigestEmail } from "@/lib/email";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendDigests(period: "daily" | "weekly") {
  const now = new Date();
  const lookback = subDays(now, period === "daily" ? 1 : 7);
  const periodLabel = period === "daily" ? "diario" : "semanal";

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, email: true },
  });

  let sent = 0;

  for (const user of users) {
    const overdue = await prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        dueDate: { lt: now },
        OR: [{ assigneeId: user.id }, { createdById: user.id }],
      },
      select: { id: true, title: true, project: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    });

    const upcoming = await prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        dueDate: { gte: now, lte: addDays(now, 7) },
        OR: [{ assigneeId: user.id }, { createdById: user.id }],
      },
      select: { id: true, title: true, dueDate: true, project: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    });

    const completed = await prisma.task.findMany({
      where: {
        status: "DONE",
        updatedAt: { gte: lookback },
        OR: [{ assigneeId: user.id }, { createdById: user.id }],
      },
      select: { id: true, title: true, project: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    if (overdue.length + upcoming.length + completed.length === 0) continue;

    try {
      await sendDigestEmail(user.email, {
        name: user.name,
        periodLabel,
        overdue: overdue.map((t) => ({
          title: t.title,
          project: t.project.name,
          taskUrl: `${appUrl}/tasks/${t.id}`,
        })),
        upcoming: upcoming.map((t) => ({
          title: t.title,
          project: t.project.name,
          due: t.dueDate ? t.dueDate.toLocaleDateString("es") : "",
          taskUrl: `${appUrl}/tasks/${t.id}`,
        })),
        completed: completed.map((t) => ({
          title: t.title,
          project: t.project.name,
          taskUrl: `${appUrl}/tasks/${t.id}`,
        })),
      });
      sent += 1;
    } catch (error) {
      console.error(`No se pudo enviar el resumen a ${user.email}:`, error);
    }
  }

  return { sent, period: periodLabel };
}
