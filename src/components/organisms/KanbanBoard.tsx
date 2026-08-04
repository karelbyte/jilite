"use client";

import { useOptimistic, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { moveTask } from "@/actions/task";
import { useToast } from "@/components/providers/ToastProvider";
import Badge from "@/components/atoms/Badge";
import Avatar from "@/components/atoms/Avatar";
import { PRIORITY_META, STATUSES, STATUS_META } from "@/lib/constants";
import type { Status } from "@/generated/prisma/client";
import type { TaskListItem } from "@/components/molecules/TaskCard";

export default function KanbanBoard({
  tasks,
  canEdit = true,
  showProject = false,
}: {
  tasks: TaskListItem[];
  canEdit?: boolean;
  showProject?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ status: Status; index: number } | null>(null);
  const [optimistic, setOptimistic] = useOptimistic(tasks);

  const byStatus = (s: Status) =>
    optimistic
      .filter((t) => t.status === s)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const onDrop = async (status: Status, index: number) => {
    const target = dragId;
    setDragId(null);
    setOver(null);
    if (!target) return;
    const task = optimistic.find((t) => t.id === target);
    if (!task) return;

    startTransition(() => {
      setOptimistic((cur) => {
        const without = cur.filter((t) => t.id !== target);
        const list = without
          .filter((t) => t.status === status)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const clamped = Math.max(0, Math.min(index, list.length));
        list.splice(clamped, 0, { ...task, status, position: clamped });
        const positions = new Map(list.map((t, i) => [t.id, i]));
        return without.map((t) =>
          positions.has(t.id) ? { ...t, status, position: positions.get(t.id)! } : t
        );
      });
    });

    const res = await moveTask(target, status, index);
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
            onDragOver={canEdit ? (e) => e.preventDefault() : undefined}
            onDragEnter={canEdit ? () => {
              if (dragId && !over) setOver({ status: s, index: items.length });
            } : undefined}
            onDragLeave={canEdit ? () => setOver((cur) => (cur?.status === s ? null : cur)) : undefined}
            onDrop={canEdit ? (e) => {
              e.preventDefault();
              onDrop(s, over?.status === s ? over.index : items.length);
            } : undefined}
            aria-label={`Columna ${meta.label}`}
            className={`flex min-h-[200px] flex-col rounded-xl border p-3 ${
              over?.status === s
                ? "border-brand-400 bg-brand-50 dark:border-brand-500/60 dark:bg-brand-500/10"
                : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.bar }} />
                {meta.label}
              </span>
              <span className="text-xs text-gray-400">{items.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {items.map((t, idx) => {
                const p = PRIORITY_META[t.priority];
                return (
                  <div
                    key={t.id}
                    draggable={canEdit}
                    onDragStart={canEdit ? () => setDragId(t.id) : undefined}
                    onDragEnter={canEdit ? () => setOver({ status: s, index: idx }) : undefined}
                    onDragEnd={canEdit ? () => {
                      setDragId(null);
                      setOver(null);
                    } : undefined}
                    aria-label={`Mover ${t.title}`}
                    className={`rounded-lg border bg-white p-3 shadow-sm ${
                      canEdit ? "cursor-grab active:cursor-grabbing" : ""
                    } ${
                      over?.status === s && over.index === idx
                        ? "border-brand-400 ring-2 ring-brand-200 dark:ring-brand-500/40"
                        : "border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                    }`}
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
                    {showProject && t.projectName ? (
                      <span className="mt-2 inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {t.projectName}
                      </span>
                    ) : null}
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
