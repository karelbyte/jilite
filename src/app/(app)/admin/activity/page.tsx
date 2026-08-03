import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const admin = await requireAdmin();

  const logs = await prisma.activityLog.findMany({
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      "user.created": "Creación de usuario",
      "user.role_changed": "Cambio de rol",
      "user.status_changed": "Cambio de estado",
      "user.deleted": "Eliminación de usuario",
      "task.created": "Creación de tarea",
      "task.updated": "Edición de tarea",
      "task.deleted": "Eliminación de tarea",
    };
    return map[action] ?? action;
  };

  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Actividad</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Últimas acciones registradas en la plataforma.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {logs.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">Sin actividad registrada.</li>
          ) : (
            logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {actionLabel(log.action)}
                  </span>
                  {log.detail ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {log.detail}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {log.actor ? log.actor.name : "Sistema"} · {formatDate(log.createdAt)}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Visto por {admin.name} — <a href="/admin/users" className="font-medium text-brand-700 hover:underline">Ir a usuarios</a>
      </p>
    </main>
  );
}