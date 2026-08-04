import "server-only";
import { prisma } from "@/lib/prisma";

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  taskId?: string | null;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        taskId: input.taskId ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo crear la notificación:", error);
  }
}

export async function notifyUsers(
  recipients: Array<{ id: string; name: string }>,
  data: Omit<CreateNotificationInput, "userId">
): Promise<void> {
  if (recipients.length === 0) return;
  await Promise.allSettled(
    recipients.map((r) =>
      createNotification({
        userId: r.id,
        type: data.type,
        title: data.title,
        body: data.body,
        taskId: data.taskId,
      })
    )
  );
}
