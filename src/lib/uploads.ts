import "server-only";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const uploadDir =
  process.env.UPLOAD_DIR ?? join(process.cwd(), "public", "uploads");
export const uploadUrl = process.env.UPLOAD_URL ?? "/uploads";

export async function ensureUploadDir() {
  await mkdir(uploadDir, { recursive: true });
}

export async function saveUpload(data: Buffer, originalName: string): Promise<string> {
  await ensureUploadDir();
  const ext = extname(originalName);
  const filename = `${randomUUID()}${ext}`;
  const fullPath = join(uploadDir, filename);
  await writeFile(fullPath, data);
  return filename;
}

export function resolveFilePath(filename: string): string {
  const base = join(uploadDir, filename);
  if (process.env.NODE_ENV === "test") return base;
  if (!base.startsWith(uploadDir)) throw new Error("Invalid file path");
  return base;
}

export function resolvePublicUrl(filename: string): string {
  return `${uploadUrl}/${encodeURIComponent(filename)}`;
}

function extname(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return "";
  return name.slice(idx).toLowerCase();
}
