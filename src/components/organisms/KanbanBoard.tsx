"use client";

import { useOptimistic, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { moveTask } from "@/actions/task";
import { useToast } from "@/components/providers/ToastProvider";
import Badge from "@/components/atoms/Badge";
import Avatar from "@/components/atoms/Avatar";
import { PRIORITY_META, STATUSES, STATUS_META } from "@/lib/constants";
import type { Status } from "@/generated/prisma/client";
import type { TaskListItem } from "@/components/molecules/TaskCard";

export default function KanbanBoard({ tasks }: { tasks: TaskListItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useOptimistic(tasks);

  const byStatus = (s: Status) => optimistic.filter((t) => t.status === s);

  const onDrop = async (status: Status) => {
    if (!dragId) return;
    const target = dragId;
    setDragId(null);
    const task = optimistic.find((t) => t.id === target);
    if (!task || task.status === status) return;

    setOptimistic((cur) =>
      cur.map((t) => (t.id === target ? { ...t, status } : t))
    );

    const res = await moveTask(target, status);
    if (res?.error) {
      toast(res.error, "error");
      router.refresh();
      return;
    }
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {STATUSES.map((s) => {
        const meta = STATUS_META[s];
        const items = byStatus(s);
        return (
          <div
            key={s}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(s)}
            aria-label={`Columna ${meta.label}`}
            className="flex min-h-[200px] flex-col rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.bar }} />
                {meta.label}
              </span>
              <span className="text-xs text-gray-400">{items.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {items.map((t) => {
                const p = PRIORITY_META[t.priority];
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    aria-label={`Mover ${t.title}`}
                    className="cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge className={p.className}>{p.label}</Badge>
                      <span className="text-xs text-gray-400">{t.commentsCount} 💬</span>
                    </div>
                    <Link
                      href={`/tasks/${t.id}`}
                      className="font-medium text-gray-900 line-clamp-2 hover:text-brand-700 dark:text-gray-100 dark:hover:text-brand-400"
                    >
                      {t.title}
                    </Link>
                    {t.assignee ? (
                      <span className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Avatar name={t.assignee.name} src={t.assignee.image} size="sm" />
                        {t.assignee.name.split(" ")[0]}
                      </span>
                    ) : null}
                  </div>
                );
              })}
              {items.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-300 py-8 text-xs text-gray-400">
                  Sin tareas
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}