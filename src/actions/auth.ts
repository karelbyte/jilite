"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendRegistrationEmail } from "@/lib/email";
import {
  generateResetToken,
  generateVerificationToken,
  resetTokenExpires,
  verificationTokenExpires,
} from "@/lib/verification";
import { loginSchema, registerSchema } from "@/lib/validations";
import { checkRateLimit, secondsUntil } from "@/lib/rateLimit";

export interface ActionState {
  error: string | null;
  message: string | null;
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message, message: null };

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const reg = checkRateLimit(`register:${normalizedEmail}`, { limit: 3 });
  if (!reg.allowed) {
    return { error: "Demasiados intentos. Espera un momento para volver a intentarlo.", message: null };
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return { error: "El correo ya está registrado", message: null };

  const hashed = await bcrypt.hash(password, 10);
  const verificationToken = generateVerificationToken();

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashed,
      role: "USER",
      status: "INACTIVE",
      verificationToken,
      verificationTokenExpires: verificationTokenExpires(),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;

  try {
    await sendRegistrationEmail(normalizedEmail, { name, verifyUrl });
  } catch (error) {
    console.error("No se pudo enviar el correo de verificación:", error);
  }

  return {
    error: null,
    message: "Cuenta creada. Revisa tu correo para confirmarla y poder iniciar sesión.",
  };
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message, message: null };

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) return { error: "Credenciales inválidas", message: null };

  const login = checkRateLimit(`login:${email}`, { limit: 5 });
  if (!login.allowed) {
    return {
      error: `Demasiados intentos. Intenta de nuevo en ${secondsUntil(login.retryAfterMs)} segundo(s).`,
      message: null,
    };
  }
  if (existing.status !== "ACTIVE") {
    return {
      error:
        "Tu cuenta no está activa. Verifica tu correo (revisa el enlace que te enviamos) o espera a que un administrador la active.",
      message: null,
    };
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Credenciales inválidas", message: null };
      }
      return { error: "No se pudo iniciar sesión", message: null };
    }
    throw error;
  }

  return { error: null, message: null };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function verifyEmailAction(token: string): Promise<{ ok: boolean; message: string }> {
  if (!token) return { ok: false, message: "Falta el código de verificación." };

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });
  if (!user) {
    return { ok: false, message: "El enlace de verificación no es válido." };
  }
  if (user.emailVerifiedAt) {
    return { ok: true, message: "Tu correo ya estaba verificado." };
  }
  if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
    return { ok: false, message: "El enlace ha caducado. Regístrate de nuevo para recibir otro." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  return { ok: true, message: "¡Correo verificado! Ya puedes iniciar sesión." };
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    return { error: "Ingresa tu correo", message: null };
  }

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  const rl = checkRateLimit(`reset:${normalized}`, { limit: 3, windowMs: 5 * 60_000 });
  if (!rl.allowed) {
    return { error: "Demasiadas solicitudes. Espera unos minutos.", message: null };
  }

  if (user && user.status === "ACTIVE") {
    const resetToken = generateResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires: resetTokenExpires() },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    try {
      await sendPasswordResetEmail(user.email, { name: user.name, resetUrl });
    } catch (error) {
      console.error("No se pudo enviar el correo de restablecimiento:", error);
    }
  }

  return {
    error: null,
    message: "Si tu correo está registrado y activo, recibirás un enlace para restablecer la contraseña.",
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = formData.get("token");
  const password = formData.get("password");
  if (typeof token !== "string" || typeof password !== "string") {
    return { error: "Datos inválidos", message: null };
  }
  if (password.length < 6 || password.length > 128) {
    return { error: "La contraseña debe tener entre 6 y 128 caracteres", message: null };
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    return { error: "El enlace de restablecimiento no es válido o ha caducado.", message: null };
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpires: null },
  });

  return { error: null, message: "Contraseña actualizada. Ya puedes iniciar sesión." };
}