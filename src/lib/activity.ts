import "server-only";
import { prisma } from "@/lib/prisma";

interface LogEntry {
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
  actorId?: string | null;
}

export async function logActivity(entry: LogEntry): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        detail: entry.detail ?? null,
        actorId: entry.actorId ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar la actividad:", error);
  }
}