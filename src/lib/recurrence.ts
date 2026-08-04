import "server-only";
import { addDays, addMonths, addWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { Recurrence } from "@/generated/prisma/client";

function advanceDate(base: Date, recurrence: Recurrence): Date {
  if (recurrence === "DAILY") return addDays(base, 1);
  if (recurrence === "WEEKLY") return addWeeks(base, 1);
  return addMonths(base, 1);
}

export async function materializeRecurringTasks() {
  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: { status: "DONE", recurrence: { not: null } },
    include: {
      subtasks: true,
      labels: true,
    },
  });

  let created = 0;

  for (const task of tasks) {
    const recurrence = task.recurrence as Recurrence;
    const base = task.lastRecurredAt ?? task.dueDate ?? task.createdAt;
    const nextDue = advanceDate(base, recurrence);

    if (task.lastRecurredAt && nextDue > now) continue;

    await prisma.$transaction(async (tx) => {
      const copy = await tx.task.create({
        data: {
          title: task.title,
          description: task.description,
          status: "TODO",
          priority: task.priority,
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          createdById: task.createdById,
          dueDate: nextDue,
          recurrence,
        },
      });

      if (task.subtasks.length > 0) {
        await tx.subtask.createMany({
          data: task.subtasks.map((s) => ({
            taskId: copy.id,
            title: s.title,
            estimateMinutes: s.estimateMinutes,
          })),
        });
      }

      if (task.labels.length > 0) {
        await tx.taskLabel.createMany({
          data: task.labels.map((l) => ({ taskId: copy.id, labelId: l.labelId })),
        });
      }

      await tx.task.update({
        where: { id: task.id },
        data: { lastRecurredAt: now },
      });
    });

    created += 1;
  }

  return { created };
}
