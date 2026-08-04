import "server-only";
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

function esc(value: string): string {
  return String(value).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]!
  );
}

interface CommentNotification {
  taskTitle: string;
  commenterName: string;
  commentBody: string;
  taskUrl: string;
}

export async function sendCommentNotification(
  to: string,
  data: CommentNotification
) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#f0fdf4; padding:32px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#166534; margin:0 0 8px;">Nuevo comentario</h2>
        <p style="color:#374151; margin:0 0 20px;">
          <strong>${esc(data.commenterName)}</strong> comentó en
          <strong>${esc(data.taskTitle)}</strong>
        </p>
        <div style="background:#f0fdf4; border-left:4px solid #22c55e; padding:16px; border-radius:8px; color:#374151;">
          ${esc(data.commentBody)}
        </div>
        <a href="${esc(data.taskUrl)}" style="display:inline-block; margin-top:24px; background:#16a34a; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Ver la tarea
        </a>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: `Nuevo comentario en "${data.taskTitle}"`,
    html,
  });
}

interface MentionNotification {
  taskTitle: string;
  mentionerName: string;
  commentBody: string;
  taskUrl: string;
}

export async function sendMentionNotification(to: string, data: MentionNotification) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#fdf2f8; padding:32px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#9d174d; margin:0 0 8px;">Te mencionaron</h2>
        <p style="color:#374151; margin:0 0 20px;">
          <strong>${esc(data.mentionerName)}</strong> te mencionó en
          <strong>${esc(data.taskTitle)}</strong>
        </p>
        <div style="background:#fdf2f8; border-left:4px solid #ec4899; padding:16px; border-radius:8px; color:#374151;">
          ${esc(data.commentBody)}
        </div>
        <a href="${esc(data.taskUrl)}" style="display:inline-block; margin-top:24px; background:#db2777; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Ver la tarea
        </a>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: `Te mencionaron en "${data.taskTitle}"`,
    html,
  });
}

interface RegistrationEmail {
  name: string;
  verifyUrl: string;
}

export async function sendRegistrationEmail(to: string, data: RegistrationEmail) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#f0fdf4; padding:32px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#166534; margin:0 0 8px;">Bienvenido a Jilite, ${esc(data.name)}</h2>
        <p style="color:#374151; margin:0 0 16px;">
          Tu cuenta fue creada correctamente. Solo falta confirmar tu correo para activarla.
        </p>
        <p style="color:#374151; margin:0 0 20px;">
          Haz clic en el botón para verificar tu dirección de email. El enlace es válido por 24 horas.
        </p>
        <a href="${esc(data.verifyUrl)}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Verificar mi correo
        </a>
        <p style="color:#6b7280; margin:24px 0 0; font-size:13px;">
          Si no puedes ver el botón, copia este enlace en tu navegador:
          <br /><a href="${esc(data.verifyUrl)}" style="color:#166534;">${esc(data.verifyUrl)}</a>
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: "Confirma tu correo en Jilite",
    html,
  });
}

interface PasswordResetEmail {
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(to: string, data: PasswordResetEmail) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#f0fdf4; padding:32px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#166534; margin:0 0 8px;">Hola, ${esc(data.name)}</h2>
        <p style="color:#374151; margin:0 0 16px;">
          Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para establecer una nueva.
        </p>
        <p style="color:#6b7280; margin:0 0 20px; font-size:13px;">
          El enlace es válido por 1 hora. Si no solicitaste este cambio, ignora este correo.
        </p>
        <a href="${esc(data.resetUrl)}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Restablecer contraseña
        </a>
        <p style="color:#6b7280; margin:24px 0 0; font-size:13px;">
          Si no puedes ver el botón, copia este enlace en tu navegador:
          <br /><a href="${esc(data.resetUrl)}" style="color:#166534;">${esc(data.resetUrl)}</a>
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: "Restablece tu contraseña en Jilite",
    html,
  });
}

interface TaskAssignedEmail {
  name: string;
  taskTitle: string;
  projectName: string;
  taskUrl: string;
}

export async function sendTaskAssignedEmail(to: string, data: TaskAssignedEmail) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#f0fdf4; padding:32px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#166534; margin:0 0 8px;">Hola, ${esc(data.name)}</h2>
        <p style="color:#374151; margin:0 0 16px;">
          Te asignaron una nueva tarea en <strong>${esc(data.projectName)}</strong>:
        </p>
        <div style="background:#f0fdf4; border-left:4px solid #22c55e; padding:16px; border-radius:8px; color:#374151;">
          <strong>${esc(data.taskTitle)}</strong>
        </div>
        <a href="${esc(data.taskUrl)}" style="display:inline-block; margin-top:24px; background:#16a34a; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Ver la tarea
        </a>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: `Te asignaron una tarea: "${data.taskTitle}"`,
    html,
  });
}

interface PasswordChangedEmail {
  name: string;
}

export async function sendPasswordChangedEmail(to: string, data: PasswordChangedEmail) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#f0fdf4; padding:32px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#166534; margin:0 0 8px;">Hola, ${esc(data.name)}</h2>
        <p style="color:#374151; margin:0 0 16px;">
          Tu contraseña de Jilite fue cambiada correctamente.
        </p>
        <p style="color:#9ca3af; margin:0 0 0; font-size:12px;">
          Si no realizaste este cambio, contacta al administrador de inmediato.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: "Tu contraseña de Jilite fue cambiada",
    html,
  });
}

export interface TaskFieldChange {
  field: string;
  label: string;
  from: string | null;
  to: string | null;
}

export interface TaskUpdatedEmail {
  name: string;
  taskTitle: string;
  projectName: string;
  changes: TaskFieldChange[];
  editorName: string;
  taskUrl: string;
}

export async function sendTaskUpdatedEmail(to: string, data: TaskUpdatedEmail) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const changesLines = data.changes
    .map(
      (c) =>
        `<div style="margin:0 0 6px; font-size:14px; color:#374151;">
          <strong>${esc(c.label)}</strong>:
          <span style="color:#6b7280;">${esc(c.from ?? "—")} → ${esc(c.to ?? "—")}</span>
        </div>`
    )
    .join("\n");

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#eff6ff; padding:32px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#1e40af; margin:0 0 8px;">Hola ${esc(data.name)}</h2>
        <p style="color:#374151; margin:0 0 8px;">
          <strong>${esc(data.editorName)}</strong> actualizó <strong>${esc(data.taskTitle)}</strong>
          (${esc(data.projectName)}).
        </p>
        <p style="color:#374151; margin:0 0 16px; font-size:13px;">
          Cambios realizados:
        </p>
        <div style="background:#f0f9ff; border-left:4px solid #3b82f6; padding:12px 16px; border-radius:8px; margin:0 0 20px;">
          ${changesLines}
        </div>
        <a href="${esc(data.taskUrl)}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Ver la tarea
        </a>
        <p style="color:#9ca3af; margin:24px 0 0; font-size:12px;">
          No contestes a este correo; las respuestas no se revisan.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: `Tarea actualizada: "${data.taskTitle}"`,
    html,
  });
}

interface TaskDueSoonEmail {
  name: string;
  taskTitle: string;
  projectName: string;
  dueDate: Date;
  dueInHours: number;
  labels: { id: string; name: string; color: string }[];
  taskUrl: string;
}

export async function sendTaskDueSoonEmail(to: string, data: TaskDueSoonEmail) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const labelChips =
    data.labels.length > 0
      ? `<div style="margin:12px 0; display:flex; gap:6px; flex-wrap:wrap;">
          ${data.labels
            .map(
              (l) =>
                `<span style="background:${colorHex(l.color)}; color:#1e293b; font-size:12px; padding:2px 8px; border-radius:999px;">${esc(l.name)}</span>`
            )
            .join("")}
        </div>`
      : "";

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#eff6ff; padding:32px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#1e40af; margin:0 0 8px;">Recordatorio de vencimiento, ${esc(data.name)}</h2>
        <p style="color:#374151; margin:0 0 8px;">
          La tarea <strong>${esc(data.taskTitle)}</strong> (${esc(data.projectName)}) vence en <strong>${data.dueInHours} hora(s)</strong>,
          el ${esc(formatDate(data.dueDate))}.
        </p>
        ${labelChips}
        <a href="${esc(data.taskUrl)}" style="display:inline-block; margin-top:16px; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Ver la tarea
        </a>
        <p style="color:#9ca3af; margin:24px 0 0; font-size:12px;">
          No contestes a este correo; las respuestas no se revisan.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: `Recordatorio: "${data.taskTitle}" vence en ${data.dueInHours}h`,
    html,
  });
}

interface TaskOverdueEmail {
  name: string;
  taskTitle: string;
  projectName: string;
  dueDate: Date;
  taskUrl: string;
}

export async function sendTaskOverdueEmail(to: string, data: TaskOverdueEmail) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#fffbeb; padding:32px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#92400e; margin:0 0 8px;">Tarea vencida, ${esc(data.name)}</h2>
        <p style="color:#374151; margin:0 0 8px;">
          La tarea <strong>${esc(data.taskTitle)}</strong> (${esc(data.projectName)}) venció el ${esc(formatDate(data.dueDate))} y sigue pendiente.
        </p>
        <a href="${esc(data.taskUrl)}" style="display:inline-block; margin-top:16px; background:#f59e0b; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Ver la tarea
        </a>
        <p style="color:#9ca3af; margin:24px 0 0; font-size:12px;">
          No contestes a este correo; las respuestas no se revisan.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: `Vencida: "${data.taskTitle}"`,
    html,
  });
}

interface InvitationEmail {
  name: string;
  inviterName: string;
  projectName: string;
  inviteUrl: string;
}

export async function sendInvitationEmail(to: string, data: InvitationEmail) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#eff6ff; padding:32px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#1e40af; margin:0 0 8px;">¡${esc(data.inviterName)} te invitó a un proyecto!</h2>
        <p style="color:#374151; margin:0 0 8px;">
          <strong>${esc(data.inviterName)}</strong> te invitó a unirte a
          <strong>${esc(data.projectName)}</strong> en Jilite.
        </p>
        <p style="color:#374151; margin:0 0 16px;">
          El enlace es válido por 7 días.
        </p>
        <a href="${esc(data.inviteUrl)}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Aceptar invitación
        </a>
        <p style="color:#9ca3af; margin:24px 0 0; font-size:12px;">
          No contestes a este correo; las respuestas no se revisan.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: `Invitación a "${data.projectName}" en Jilite`,
    html,
  });
}

interface DigestEmail {
  name: string;
  periodLabel: string;
  overdue: { title: string; project: string; taskUrl: string }[];
  upcoming: { title: string; project: string; due: string; taskUrl: string }[];
  completed: { title: string; project: string; taskUrl: string }[];
}

export async function sendDigestEmail(to: string, data: DigestEmail) {
  const from = process.env.RESEND_FROM ?? "Jilite <onboarding@resend.dev>";

  const renderList = (
    items: Array<{ title: string; project: string; taskUrl: string; due?: string }>,
    color: string,
    empty: string
  ) =>
    items.length === 0
      ? `<p style="color:#9ca3af; font-size:13px; margin:0 0 16px;">${empty}</p>`
      : items
          .map(
            (t) =>
              `<div style="margin:0 0 8px;">
                <a href="${esc(t.taskUrl)}" style="color:#1f2937; text-decoration:none; font-weight:600;">${esc(t.title)}</a>
                <span style="color:#6b7280; font-size:13px;"> — ${esc(t.project)}${t.due ? ` · vence ${esc(t.due)}` : ""}</span>
              </div>`
          )
          .join("");

  const html = `
    <div style="font-family: system-ui, sans-serif; background:#f0fdf4; padding:32px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <h2 style="color:#166534; margin:0 0 6px;">Hola, ${esc(data.name)}</h2>
        <p style="color:#374151; margin:0 0 24px;">Tu resumen ${esc(data.periodLabel)} de Jilite.</p>

        <h3 style="color:#b91c1c; margin:0 0 8px; font-size:15px;">Vencidas</h3>
        ${renderList(data.overdue, "#b91c1c", "Sin tareas vencidas. 🎉")}

        <h3 style="color:#1e40af; margin:0 0 8px; font-size:15px;">Próximas</h3>
        ${renderList(data.upcoming, "#1e40af", "Sin tareas próximas.")}

        <h3 style="color:#15803d; margin:0 0 8px; font-size:15px;">Completadas</h3>
        ${renderList(data.completed, "#15803d", "Sin tareas completadas.")}

        <a href="${esc(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")}/dashboard" style="display:inline-block; margin-top:16px; background:#16a34a; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">
          Ir al tablero
        </a>
        <p style="color:#9ca3af; margin:24px 0 0; font-size:12px;">
          No contestes a este correo; las respuestas no se revisan.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: `Tu resumen ${data.periodLabel} de Jilite`,
    html,
  });
}

function formatDate(d: Date): string {  return d.toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function colorHex(hex?: string): string {
  if (!hex) return "#94a3b8";
  return hex.startsWith("#") ? hex : `#${hex}`;
}
