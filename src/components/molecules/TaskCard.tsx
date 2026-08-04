import Link from "next/link";
import { deleteTask } from "@/actions/task";
import { PRIORITY_META, STATUS_META } from "@/lib/constants";
import type { Priority, Status } from "@/generated/prisma/client";
import Badge from "@/components/atoms/Badge";
import Avatar from "@/components/atoms/Avatar";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  commentsCount: number;
  dueDate: Date | string | null;
  assignee: { name: string; image: string | null } | null;
  canDelete: boolean;
  position?: number;
  projectName?: string;
}

export default function TaskCard({ task }: { task: TaskListItem }) {
  const status = STATUS_META[task.status];
  const priority = PRIORITY_META[task.priority];

  return (
    <div className="relative">
      <Link
        href={`/tasks/${task.id}`}
        className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="mb-2 flex items-center gap-2 pr-8">
          <Badge className={priority.className}>{priority.label}</Badge>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
        <h3 className="font-medium text-gray-900 line-clamp-2 dark:text-gray-100">{task.title}</h3>
        {task.description ? (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">{task.description}</p>
        ) : null}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">{task.commentsCount} comentarios</span>
          {task.assignee ? (
            <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Avatar name={task.assignee.name} src={task.assignee.image} size="sm" />
              {task.assignee.name.split(" ")[0]}
            </span>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">Sin asignar</span>
          )}
        </div>
        {task.dueDate ? (
          <p
            className={`mt-2 text-xs ${
              task.status !== "DONE" && new Date(task.dueDate) < new Date()
                ? "text-red-600 dark:text-red-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            Vence: {new Date(task.dueDate).toLocaleDateString("es")}
          </p>
        ) : null}
      </Link>

      {task.canDelete ? (
        <div className="absolute right-2 top-2">
          <ConfirmDialog
            action={deleteTask.bind(null, task.id)}
            title="Eliminar tarea"
            message="¿Seguro que quieres eliminar esta tarea? Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            triggerVariant="ghost"
            confirmVariant="danger"
            size="sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="h-4 w-4 text-gray-400 hover:text-red-600"
            >
              <path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </ConfirmDialog>
        </div>
      ) : null}
    </div>
  );
}