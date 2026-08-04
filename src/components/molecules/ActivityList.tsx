import { timeAgo } from "@/lib/format";
import { actionLabel, type ActivityItem } from "@/lib/activityLabels";

interface Props {
  items: ActivityItem[];
  emptyText?: string;
}

export default function ActivityList({ items, emptyText = "Sin actividad registrada." }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((log) => (
          <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {actionLabel(log.action)}
              </span>
              {log.detail ? (
                <span className="max-w-[320px] truncate rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {log.detail}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <span>{log.actor ? log.actor.name : "Sistema"}</span>
              <span>·</span>
              <span>{timeAgo(log.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
