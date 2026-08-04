"use server";

import { requireUser, canEditProjectContent } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/csv";
import { statusSchema, prioritySchema, taskSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export interface CsvImportResult {
  error: string | null;
  created: number;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-záéíóúñ]/g, "").replace("fechalimite", "fecha_limite");
}

export async function importTasksFromCsv(formData: FormData): Promise<CsvImportResult> {
  const user = await requireUser();
  const projectId = formData.get("projectId");
  const raw = formData.get("csv");

  if (typeof projectId !== "string" || typeof raw !== "string" || raw.trim() === "") {
    return { error: "Faltan datos (proyecto o archivo CSV).", created: 0 };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Proyecto no encontrado.", created: 0 };
  if (!(await canEditProjectContent(user, projectId))) {
    return { error: "No tenés permisos para importar tareas en este proyecto.", created: 0 };
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, email: true } } },
  });
  const emailToId = new Map<string, string>();
  for (const m of members) {
    const em = m.user.email.trim().toLowerCase();
    if (em) emailToId.set(em, m.user.id);
  }

  const labels = await prisma.label.findMany({ where: { projectId } });
  const nameToLabel = new Map(labels.map((l) => [l.name.trim().toLowerCase(), l.id]));

  const rows = parseCsv(raw);
  if (rows.length < 2) {
    logger.warn("csv.import.empty", { userId: user.id, projectId });
    return { error: "El CSV no tiene filas de datos.", created: 0 };
  }

  const header = rows[0].map(normalizeHeader);
  const col = (h: string) => header.indexOf(normalizeHeader(h));

  let created = 0;
  let firstError: string | null = null;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const get = (h: string) => {
      const idx = col(h);
      return idx >= 0 && idx < r.length ? r[idx].trim() : "";
    };

    const title = get("titulo");
    if (!title) continue;

    const data = taskSchema.safeParse({
      title,
      description: get("descripcion"),
      status: statusSchema.safeParse(get("estado").toUpperCase()).success ? get("estado").toUpperCase() : "TODO",
      priority: prioritySchema.safeParse(get("prioridad").toUpperCase()).success ? get("prioridad").toUpperCase() : "MEDIUM",
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(get("fecha_limite")) ? get("fecha_limite") : "",
      recurrence: ["DAILY", "WEEKLY", "MONTHLY"].includes(get("recurrencia").toUpperCase())
        ? get("recurrencia").toUpperCase()
        : "",
    });

    if (!data.success) {
      if (!firstError) firstError = `Fila ${i + 1}: ${data.error.issues[0]?.message ?? "inválida"}`;
      continue;
    }

    const assigneeEmail = get("asignado").toLowerCase();
    const assigneeId = emailToId.get(assigneeEmail) ?? null;
    const dueDate = data.data.dueDate ? new Date(data.data.dueDate + "T00:00:00Z") : null;

    const task = await prisma.task.create({
      data: {
        title: data.data.title,
        description: data.data.description || null,
        status: data.data.status,
        priority: data.data.priority,
        assigneeId,
        dueDate,
        recurrence: (data.data.recurrence as "DAILY" | "WEEKLY" | "MONTHLY" | null) || null,
        createdById: user.id,
        projectId,
      },
      select: { id: true },
    });

    const labelNames = get("etiquetas")
      .split(";")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const labelIds = [...new Set(labelNames.map((n) => nameToLabel.get(n)).filter((v): v is string => Boolean(v)))];
    if (labelIds.length > 0) {
      await prisma.taskLabel.createMany({
        data: labelIds.map((labelId) => ({ taskId: task.id, labelId })),
      });
    }

    created++;
  }

  logger.info("csv.import.completed", {
    userId: user.id,
    projectId,
    created,
    totalRows: rows.length - 1,
    skipped: rows.length - 1 - created,
  });

  return { error: firstError, created };
}
