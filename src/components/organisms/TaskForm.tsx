"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTask } from "@/actions/task";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import MarkdownEditor from "@/components/organisms/MarkdownEditor";
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from "@/lib/constants";

interface Props {
  projectId: string;
  users: { id: string; name: string }[];
  onSuccess?: () => void;
  onCreated?: (taskId: string) => void;
}

export default function TaskForm({ projectId, users, onSuccess, onCreated }: Props) {
  const [state, formAction, pending] = useActionState(createTask, { error: null, id: null });
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (wasPending.current) {
      wasPending.current = false;
      if (!state.error) {
        onSuccess?.();
        if (state.id) onCreated?.(state.id);
      }
    }
  }, [pending, state.error, state.id, onSuccess, onCreated]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Título
        </label>
        <Input id="title" name="title" required maxLength={200} placeholder="Título de la tarea" />
      </div>
      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <MarkdownEditor id="description" name="description" rows={4} placeholder="Detalles de la tarea" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Estado
          </label>
          <Select id="status" name="status" defaultValue="TODO">
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
          <Select id="priority" name="priority" defaultValue="MEDIUM">
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="dueDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha límite
          </label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
        <div className="space-y-1">
          <label htmlFor="assigneeId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Asignado a
          </label>
          <Select id="assigneeId" name="assigneeId" defaultValue="">
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear tarea"}
        </Button>
      </div>
    </form>
  );
}