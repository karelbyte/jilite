"use server";

import { revalidatePath } from "next/cache";
import { getAuthedUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export interface ViewActionState {
  error: string | null;
  message: string | null;
}

export async function saveViewAction(
  _prev: ViewActionState,
  formData: FormData
): Promise<ViewActionState> {
  const user = await getAuthedUser();
  if (!user) return { error: "No autorizado", message: null };

  const projectId = formData.get("projectId");
  const name = formData.get("name");
  const filtersRaw = formData.get("filters");
  if (
    typeof projectId !== "string" ||
    typeof name !== "string" ||
    typeof filtersRaw !== "string" ||
    !name.trim()
  ) {
    return { error: "Datos inválidos", message: null };
  }

  let filters: unknown;
  try {
    filters = JSON.parse(filtersRaw);
  } catch {
    return { error: "Filtros inválidos", message: null };
  }

  const rl = checkRateLimit(`view:${user.id}`, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return { error: "Demasiadas vistas guardadas. Espera un momento.", message: null };
  }

  const existing = await prisma.savedView.findFirst({
    where: { userId: user.id, projectId, name: name.trim() },
  });
  if (existing) {
    await prisma.savedView.update({
      where: { id: existing.id },
      data: { filters: filters as object },
    });
    revalidatePath(`/projects/${projectId}`);
    return { error: null, message: `Vista "${name.trim()}" actualizada` };
  }

  await prisma.savedView.create({
    data: { userId: user.id, projectId, name: name.trim(), filters: filters as object },
  });
  revalidatePath(`/projects/${projectId}`);
  return { error: null, message: `Vista "${name.trim()}" guardada` };
}

export async function deleteViewAction(id: string) {
  const user = await getAuthedUser();
  if (!user) return;

  const view = await prisma.savedView.findUnique({ where: { id } });
  if (!view || view.userId !== user.id) return;

  await prisma.savedView.delete({ where: { id } });
  revalidatePath(`/projects/${view.projectId}`);
}
