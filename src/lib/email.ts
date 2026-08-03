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