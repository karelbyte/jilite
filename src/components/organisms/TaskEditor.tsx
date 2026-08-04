"use client";

import { useActionState } from "react";
import { updateTask } from "@/actions/task";
import type { Task } from "@/generated/prisma/client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import MarkdownEditor from "@/components/organisms/MarkdownEditor";
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from "@/lib/constants";

interface Props {
  task: Pick<Task, "id" | "title" | "description" | "status" | "priority" | "assigneeId" | "dueDate">;
  users: { id: string; name: string }[];
}

export default function TaskEditor({ task, users }: Props) {
  const [state, formAction, pending] = useActionState(updateTask, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={task.id} />
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Título
        </label>
        <Input id="title" name="title" required maxLength={200} defaultValue={task.title} />
      </div>
      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <MarkdownEditor id="description" name="description" defaultValue={task.description ?? ""} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Estado
          </label>
          <Select id="status" name="status" defaultValue={task.status}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Prioridad
          </label>
          <Select id="priority" name="priority" defaultValue={task.priority}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="assigneeId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Asignado a
          </label>
          <Select id="assigneeId" name="assigneeId" defaultValue={task.assigneeId ?? ""}>
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="dueDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha límite
          </label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""}
          />
        </div>
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}