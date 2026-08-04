import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notification";
import Button from "@/components/atoms/Button";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: { task: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => n.readAt === null).length;

  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unread > 0 ? `Tienes ${unread} sin leer.` : "No tienes notificaciones sin leer."}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary" size="sm">
              Marcar todas como leídas
            </Button>
          </form>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            Sin notificaciones.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((n) => {
              const isUnread = n.readAt === null;
              const title = n.task ? (
                <Link href={`/tasks/${n.taskId}`} className="hover:text-brand-700 dark:hover:text-brand-400">
                  {n.title}
                </Link>
              ) : (
                n.title
              );
              return (
                <li
                  key={n.id}
                  className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${
                    isUnread ? "bg-brand-50/50 dark:bg-brand-900/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isUnread ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="No leída" />
                    ) : null}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
                      {n.body ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{n.body}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span>{timeAgo(n.createdAt)}</span>
                    {isUnread ? (
                      <form action={markNotificationRead.bind(null, n.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-gray-300 px-2 py-1 font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Marcar leída
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
