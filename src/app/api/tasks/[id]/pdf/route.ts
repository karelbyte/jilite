import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return new Response(null, { status: 401 });

  const { id } = await ctx.params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { name: true, createdById: true } },
      assignee: { select: { name: true, email: true } },
      createdBy: { select: { name: true, email: true } },
      labels: { include: { label: true } },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      subtasks: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!task) return new Response(null, { status: 404 });

  if (user.role !== "ADMIN") {
    const project = await prisma.project.findUnique({ where: { id: task.projectId } });
    const isOwner = project?.createdById === user.id;
    const membership =
      project &&
      (await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
      }));
    if (!project || (!isOwner && !membership)) {
      return new Response(null, { status: 404 });
    }
  }

  const doc = await PDFDocument.create();
  doc.setTitle(task.title);
  doc.setSubject(task.project?.name ?? "Tarea");
  const page = doc.addPage([595, 842]);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  let y = 800;
  const maxWidth = 595 - margin * 2;
  const write = (text: string, opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const font = opts.font ?? helvetica;
    const size = opts.size ?? 11;
    const color = opts.color ?? rgb(0.1, 0.1, 0.1);
    const lines = wrapText(winSafe(text), font, size, maxWidth);
    for (const line of lines) {
      if (y < 60) {
        const np = doc.addPage([595, 842]);
        y = 800;
        void np;
      }
      page.drawText(line, { x: margin, y, size, font, color });
      y -= size + 4;
    }
    return lines.length;
  };

  write(task.title, { font: bold, size: 18 });
  y -= 6;
  write(`Proyecto: ${task.project?.name ?? "—"}`, { size: 11, color: rgb(0.35, 0.35, 0.35) });
  write(
    `Estado: ${statusLabel(task.status)}  •  Prioridad: ${priorityLabel(task.priority)}` +
      (task.dueDate ? `  •  Vence: ${task.dueDate.toLocaleDateString("es")}` : ""),
    { size: 10, color: rgb(0.35, 0.35, 0.35) }
  );
  write(`Creado por: ${task.createdBy.name}`, { size: 10, color: rgb(0.35, 0.35, 0.35) });
  write(`Asignado a: ${task.assignee?.name ?? "Sin asignar"}`, { size: 10, color: rgb(0.35, 0.35, 0.35) });

  y -= 12;
  if (task.labels.length > 0) {
    write(`Etiquetas: ${task.labels.map((l) => l.label.name).join(", ")}`, { size: 10 });
    y -= 6;
  }

  if (task.description) {
    y -= 6;
    write("Descripción", { font: bold, size: 12 });
    write(task.description, { size: 11 });
  }

  if (task.subtasks.length > 0) {
    y -= 10;
    write("Subtareas", { font: bold, size: 12 });
    for (const s of task.subtasks) {
      write(`${s.done ? "[x]" : "[ ]"} ${s.title}`, { size: 10 });
    }
  }

  if (task.comments.length > 0) {
    y -= 10;
    write("Comentarios", { font: bold, size: 12 });
    for (const c of task.comments) {
      write(`${c.author.name}: ${c.body}`, { size: 10 });
      y -= 2;
    }
  }

  const pdfBytes = await doc.save();
  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(task.title)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function winSafe(text: string): string {
  return text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/[\u00A0]/g, " ").replace(/[^\x00-\xFF\u20AC\u0160\u0161\u017D\u017E\u0192\u0152\u0153\u0178\u02C6\u02DC]/g, "");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function statusLabel(s: string): string {
  return { TODO: "Por hacer", IN_PROGRESS: "En curso", DONE: "Completada" }[s] ?? s;
}
function priorityLabel(p: string): string {
  return { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" }[p] ?? p;
}
