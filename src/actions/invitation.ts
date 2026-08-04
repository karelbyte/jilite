"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activity";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface InvitationActionState {
  error: string | null;
  message: string | null;
  inviteUrl: string | null;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export async function inviteMemberAction(
  _prev: InvitationActionState,
  formData: FormData
): Promise<InvitationActionState> {
  const actor = await getAuthedUser();
  if (!actor) return { error: "No autorizado", message: null, inviteUrl: null };

  const projectId = formData.get("projectId");
  const email = formData.get("email");
  if (typeof projectId !== "string" || typeof email !== "string") {
    return { error: "Datos inválidos", message: null, inviteUrl: null };
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: "Correo inválido", message: null, inviteUrl: null };
  }

  const rl = checkRateLimit(`invite:${projectId}:${normalized}`, { limit: 3, windowMs: 5 * 60_000 });
  if (!rl.allowed) {
    return { error: "Demasiadas invitaciones. Espera unos minutos.", message: null, inviteUrl: null };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Proyecto no encontrado", message: null, inviteUrl: null };

  if (actor.role !== "ADMIN" && project.createdById !== actor.id) {
    return { error: "No tienes permiso para invitar miembros", message: null, inviteUrl: null };
  }

  const existingMember = await prisma.projectMember.findFirst({
    where: { projectId, user: { email: normalized } },
  });
  if (existingMember) {
    return { error: "Este correo ya es miembro del proyecto", message: null, inviteUrl: null };
  }

  const existing = await prisma.invitation.findFirst({
    where: { projectId, email: normalized, accepted: false },
  });
  if (existing && existing.expiresAt > new Date()) {
    const inviteUrl = `${appUrl}/invite?token=${encodeURIComponent(existing.token)}`;
    return { error: null, message: "Ya existe una invitación pendiente. Reenviando...", inviteUrl };
  }

  const token = generateInviteToken();
  const invitation = await prisma.invitation.create({
    data: {
      projectId,
      email: normalized,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      token,
    },
  });

  const inviteUrl = `${appUrl}/invite?token=${encodeURIComponent(token)}`;

  try {
    await sendInvitationEmail(normalized, {
      name: normalized.split("@")[0],
      inviterName: actor.name,
      projectName: project.name,
      inviteUrl,
    });
  } catch (error) {
    console.error("No se pudo enviar la invitación:", error);
    return {
      error: null,
      message: "Invitación creada, pero no se pudo enviar el correo. Copiá el link y compartilo manualmente.",
      inviteUrl,
    };
  }

  revalidatePath(`/projects/${projectId}`);
  await logActivity({
    action: "project.invite_sent",
    entity: "invitation",
    entityId: invitation.id,
    detail: normalized,
    actorId: actor.id,
  });

  return { error: null, message: "Invitación enviada", inviteUrl };
}

export async function acceptInvitationAction(
  _prev: { ok: boolean; message: string },
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const actor = await getAuthedUser();
  if (!actor) return { ok: false, message: "Debes iniciar sesión para aceptar la invitación." };

  const token = formData.get("token");
  if (typeof token !== "string") return { ok: false, message: "Token inválido." };

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { project: { select: { name: true, createdById: true } } },
  });
  if (!invitation) return { ok: false, message: "La invitación no es válida." };
  if (invitation.accepted) return { ok: false, message: "La invitación ya fue aceptada." };
  if (invitation.expiresAt < new Date()) return { ok: false, message: "La invitación expiró." };

  if (actor.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return { ok: false, message: "Esta invitación es para otro correo." };
  }

  const canManage =
    actor.role === "ADMIN" ||
    (actor.role === "PROJECT_ADMIN" && invitation.project.createdById === actor.id);
  if (!canManage) {
    // only the invited user can accept; admins of OTHER projects don't auto-join
  }

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: invitation.projectId, userId: actor.id } },
    create: { projectId: invitation.projectId, userId: actor.id },
    update: {},
  });

  await prisma.invitation.update({ where: { token }, data: { accepted: true } });

  revalidatePath(`/projects/${invitation.projectId}`);
  await logActivity({
    action: "project.member_joined_invite",
    entity: "project",
    entityId: invitation.projectId,
    detail: invitation.email,
    actorId: actor.id,
  });

  return { ok: true, message: `Te uniste a ${invitation.project.name}.` };
}
