"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { deleteUploads } from "@/lib/uploads";
import { registerSchema, roleValueSchema } from "@/lib/validations";
import { sendRegistrationEmail } from "@/lib/email";
import { generateVerificationToken, verificationTokenExpires } from "@/lib/verification";
import type { UserStatus } from "@/generated/prisma/client";

export interface ActionState {
  error: string | null;
  message: string | null;
}

export async function adminCreateUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAuthedUser();
  if (!admin || admin.role !== "ADMIN") return { error: "No autorizado", message: null };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, message: null };

  const role = roleValueSchema.safeParse(formData.get("role"));
  if (!role.success) return { error: "Rol inválido", message: null };

  const statusRaw = formData.get("status");
  const status: UserStatus = statusRaw === "ACTIVE" ? "ACTIVE" : "INACTIVE";

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) return { error: "El correo ya está registrado", message: null };

  const hashed = await bcrypt.hash(parsed.data.password, 10);

  const verificationToken = status === "INACTIVE" ? generateVerificationToken() : null;
  const created = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      password: hashed,
      role: role.data,
      status,
      createdById: admin.id,
      ...(verificationToken
        ? { verificationToken, verificationTokenExpires: verificationTokenExpires() }
        : {}),
    },
  });

  if (verificationToken) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    try {
      await sendRegistrationEmail(created.email, {
        name: created.name,
        verifyUrl,
      });
    } catch (error) {
      console.error("No se pudo enviar el correo de verificación al usuario creado:", error);
      return {
        error: null,
        message:
          "Usuario creado, pero no se pudo enviar el correo de verificación. Actívalo manualmente o reintenta.",
      };
    }
  }

  revalidatePath("/admin/users");
  await logActivity({
    action: "user.created",
    entity: "user",
    entityId: parsed.data.email.toLowerCase(),
    detail: role.data,
    actorId: admin.id,
  });
  return { error: null, message: "Usuario creado" };
}

export async function adminUpdateRole(
  userId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAuthedUser();
  if (!admin || admin.role !== "ADMIN") return { error: "No autorizado", message: null };

  const role = formData.get("role");
  const parsed = roleValueSchema.safeParse(role);
  if (!parsed.success) return { error: "Rol inválido", message: null };
  if (userId === admin.id) return { error: "No puedes cambiar tu propio rol", message: null };

  await prisma.user.update({ where: { id: userId }, data: { role: parsed.data } });

  revalidatePath("/admin/users");
  await logActivity({
    action: "user.role_changed",
    entity: "user",
    entityId: userId,
    detail: parsed.data,
    actorId: admin.id,
  });
  return { error: null, message: "Rol actualizado" };
}

export async function adminToggleStatus(
  userId: string,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await getAuthedUser();
  if (!admin || admin.role !== "ADMIN") return { error: "No autorizado", message: null };
  if (userId === admin.id) return { error: "No puedes cambiar tu propio estado", message: null };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado", message: null };

  const next: UserStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.user.update({ where: { id: userId }, data: { status: next } });

  revalidatePath("/admin/users");
  await logActivity({
    action: "user.status_changed",
    entity: "user",
    entityId: userId,
    detail: next,
    actorId: admin.id,
  });
  return { error: null, message: next === "ACTIVE" ? "Usuario activado" : "Usuario desactivado" };
}

export async function adminDeleteUser(
  userId: string,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await getAuthedUser();
  if (!admin || admin.role !== "ADMIN") return { error: "No autorizado", message: null };
  if (userId === admin.id) return { error: "No puedes eliminar tu propia cuenta", message: null };

  const assignedTasks = await prisma.task.count({
    where: { assigneeId: userId },
  });
  if (assignedTasks > 0) {
    return {
      error: `No se puede eliminar: tiene ${assignedTasks} tarea asignada.`,
      message: null,
    };
  }

  const orphanFilenames = await prisma.file.findMany({
    where: { OR: [{ uploadedById: userId }, { task: { createdById: userId } }] },
    select: { filename: true },
  });

  await prisma.user.delete({ where: { id: userId } });

  await deleteUploads(orphanFilenames.map((f) => f.filename));

  revalidatePath("/admin/users");
  await logActivity({
    action: "user.deleted",
    entity: "user",
    entityId: userId,
    actorId: admin.id,
  });
  return { error: null, message: "Usuario eliminado" };
}

export async function adminBulkSetStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAuthedUser();
  if (!admin || admin.role !== "ADMIN") return { error: "No autorizado", message: null };

  const ids = formData.getAll("ids").map((v) => String(v));
  const statusRaw = String(formData.get("status") || "");
  if (ids.length === 0) return { error: "Selecciona al menos un usuario", message: null };
  const status: UserStatus = statusRaw === "ACTIVE" ? "ACTIVE" : "INACTIVE";

  const cleanIds = ids.filter((id) => id !== admin.id);
  if (cleanIds.length === 0) return { error: "No puedes cambiar tu propio estado", message: null };

  const result = await prisma.user.updateMany({
    where: { id: { in: cleanIds } },
    data: { status },
  });

  revalidatePath("/admin/users");
  await logActivity({
    action: "users.bulk_status_changed",
    entity: "user",
    detail: `${result.count} usuarios → ${status}`,
    actorId: admin.id,
  });
  return { error: null, message: `${result.count} usuario(s) actualizados` };
}