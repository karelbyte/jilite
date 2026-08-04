import "server-only";
import { prisma } from "@/lib/prisma";
import { sendTaskDueSoonEmail, sendTaskOverdueEmail } from "@/lib/email";
import { postWebhook } from "@/lib/notify";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const defaultWindowHours = 24;

export async function sendDueDateReminders(opts?: { windowHours?: number }): Promise<{
  sent: number;
  overdue: number;
  errors: string[];
}> {
  const windowHours = opts?.windowHours ?? defaultWindowHours;
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

  const dueTasks = await prisma.task.findMany({
    where: {
      dueDate: { gte: now, lte: windowEnd },
      reminderSentAt: null,
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      projectId: true,
      project: { select: { name: true } },
      assigneeId: true,
      assignee: { select: { id: true, name: true, email: true, status: true } },
      createdById: true,
      createdBy: { select: { id: true, name: true, email: true, status: true } },
      labels: {
        include: { label: true },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const task of dueTasks) {
    try {
      const dueDate = task.dueDate;
      if (!dueDate) continue;
      const taskUrl = `${appUrl}/tasks/${task.id}`;

      const recipients = new Map<string, { email: string; name: string }>();
      const add = (u: { email: string; name: string; status: string } | null | undefined) => {
        if (u && u.email && u.status === "ACTIVE") {
          recipients.set(u.email, { email: u.email, name: u.name });
        }
      };
      add(task.assignee ?? undefined);
      add(task.createdBy ?? undefined);

      const dueInHours = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      const labels = task.labels.map((l) => l.label);

      await Promise.allSettled(
        [...recipients.values()].map((r) =>
          sendTaskDueSoonEmail(r.email, {
            name: r.name,
            taskTitle: task.title,
            projectName: task.project?.name ?? "el proyecto",
            dueDate,
            dueInHours,
            labels,
            taskUrl,
          })
        )
      );

      await postWebhook({
        text: `⏰ Vence pronto: "${task.title}" (${dueInHours}h) en "${task.project?.name ?? "el proyecto"}"`,
        taskUrl,
      });

      await prisma.task.update({
        where: { id: task.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      errors.push(`${task.id}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  const overdue = await sendOverdueReminders();
  return { sent, overdue, errors };
}

async function sendOverdueReminders(): Promise<number> {
  const now = new Date();
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      dueDate: { lt: now },
      reminderSentAt: null,
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      projectId: true,
      project: { select: { name: true } },
      assigneeId: true,
      assignee: { select: { id: true, name: true, email: true, status: true } },
      createdById: true,
      createdBy: { select: { id: true, name: true, email: true, status: true } },
    },
  });

  let overdue = 0;
  for (const task of overdueTasks) {
    try {
      const dueDate = task.dueDate;
      if (!dueDate) continue;
      const taskUrl = `${appUrl}/tasks/${task.id}`;
      const recipients = new Map<string, { email: string; name: string }>();
      const add = (u: { email: string; name: string; status: string } | null | undefined) => {
        if (u && u.email && u.status === "ACTIVE") {
          recipients.set(u.email, { email: u.email, name: u.name });
        }
      };
      add(task.assignee ?? undefined);
      add(task.createdBy ?? undefined);

      await Promise.allSettled(
        [...recipients.values()].map((r) =>
          sendTaskOverdueEmail(r.email, {
            name: r.name,
            taskTitle: task.title,
            projectName: task.project?.name ?? "el proyecto",
            dueDate,
            taskUrl,
          })
        )
      );

      await postWebhook({
        text: `🔴 Vencida: "${task.title}" en "${task.project?.name ?? "el proyecto"}"`,
        taskUrl,
      });

      await prisma.task.update({
        where: { id: task.id },
        data: { reminderSentAt: new Date() },
      });
      overdue++;
    } catch {
      /* continuar con la siguiente */
    }
  }
  return overdue;
}
