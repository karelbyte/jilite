import "server-only";
import { randomBytes } from "crypto";

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function verificationTokenExpires(): Date {
  return new Date(Date.now() + VERIFICATION_TTL_MS);
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function resetTokenExpires(): Date {
  return new Date(Date.now() + RESET_TTL_MS);
}