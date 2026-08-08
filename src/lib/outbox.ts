import "server-only";
import { prisma } from "@/lib/prisma";
import {
  sendCommentNotification,
  sendInvitationEmail,
  sendMentionNotification,
  sendTaskAssignedEmail,
  sendTaskUpdatedEmail,
  type TaskFieldChange,
} from "@/lib/email";
import { postWebhook } from "@/lib/notify";
import type { Prisma } from "@/generated/prisma/client";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;
const MAX_BACKOFF_MS = 15 * 60 * 1000;

type EmailKind = "task_assigned" | "task_updated" | "comment" | "mention" | "invitation";

interface TaskAssignedData {
  name: string;
  taskTitle: string;
  projectName: string;
  taskUrl: string;
}
interface TaskUpdatedData {
  name: string;
  taskTitle: string;
  projectName: string;
  changes: TaskFieldChange[];
  editorName: string;
  taskUrl: string;
}
interface CommentData {
  taskTitle: string;
  commenterName: string;
  commentBody: string;
  taskUrl: string;
}
interface MentionData {
  taskTitle: string;
  mentionerName: string;
  commentBody: string;
  taskUrl: string;
}
interface InvitationData {
  name: string;
  inviterName: string;
  projectName: string;
  inviteUrl: string;
}

export async function enqueueEmail(
  kind: EmailKind,
  to: string,
  data: TaskAssignedData | TaskUpdatedData | CommentData | MentionData | InvitationData
): Promise<void> {
  await prisma.outbox.create({
    data: {
      kind: `email:${kind}`,
      payload: { to, data } as unknown as Prisma.InputJsonObject,
    },
  });
}

export async function enqueueWebhook(text: string, taskUrl?: string): Promise<void> {
  await prisma.outbox.create({
    data: {
      kind: "webhook",
      payload: { text, taskUrl: taskUrl ?? null } as Prisma.InputJsonObject,
    },
  });
}

export async function processOutbox(limit = BATCH_SIZE): Promise<{
  processed: number;
  sent: number;
  retried: number;
  failed: number;
}> {
  const jobs = await prisma.outbox.findMany({
    where: { status: "PENDING", availableAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let retried = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await dispatchJob(job.kind, job.payload);
      await prisma.outbox.update({
        where: { id: job.id },
        data: { status: "DONE", processedAt: new Date(), lastError: null },
      });
      sent++;
    } catch (error) {
      const attempts = job.attempts + 1;
      const errMsg = error instanceof Error ? error.message : String(error);
      if (attempts >= MAX_ATTEMPTS) {
        await prisma.outbox.update({
          where: { id: job.id },
          data: { status: "FAILED", attempts, lastError: errMsg },
        });
        failed++;
      } else {
        const backoffMs = Math.min(60_000 * attempts, MAX_BACKOFF_MS);
        await prisma.outbox.update({
          where: { id: job.id },
          data: {
            attempts,
            lastError: errMsg,
            availableAt: new Date(Date.now() + backoffMs),
          },
        });
        retried++;
      }
    }
  }

  return { processed: jobs.length, sent, retried, failed };
}

async function dispatchJob(kind: string, payload: Prisma.JsonValue): Promise<void> {
  if (kind === "webhook") {
    const { text, taskUrl } = payload as { text: string; taskUrl?: string | null };
    await postWebhook({ text, taskUrl: taskUrl ?? undefined });
    return;
  }

  if (kind.startsWith("email:")) {
    const emailKind = kind.slice("email:".length) as EmailKind;
    const { to, data } = payload as { to: string; data: Record<string, unknown> };
    await dispatchEmail(emailKind, to, data);
    return;
  }

  throw new Error(`Unknown outbox kind: ${kind}`);
}

async function dispatchEmail(kind: EmailKind, to: string, data: Record<string, unknown>): Promise<void> {
  switch (kind) {
    case "task_assigned":
      await sendTaskAssignedEmail(to, data as unknown as TaskAssignedData);
      break;
    case "task_updated":
      await sendTaskUpdatedEmail(to, data as unknown as TaskUpdatedData);
      break;
    case "comment":
      await sendCommentNotification(to, data as unknown as CommentData);
      break;
    case "mention":
      await sendMentionNotification(to, data as unknown as MentionData);
      break;
    case "invitation":
      await sendInvitationEmail(to, data as unknown as InvitationData);
      break;
    default:
      throw new Error(`Unknown email kind: ${kind}`);
  }
}
