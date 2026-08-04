"use client";

import { useState, useActionState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import Modal from "@/components/molecules/Modal";
import Pagination from "@/components/molecules/Pagination";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import TaskCard, { type TaskListItem } from "@/components/molecules/TaskCard";
import EmptyState from "@/components/molecules/EmptyState";
import KanbanBoard from "@/components/organisms/KanbanBoard";
import TaskForm from "@/components/organisms/TaskForm";
import { bulkUpdateTasks, bulkDeleteTasks } from "@/actions/task";
import { STATUSES, STATUS_META } from "@/lib/constants";

interface Props {
  tasks: TaskListItem[];
  users: { id: string; name: string }[];
  projectId: string;
  search: string;
  status: string;
  page: number;
  totalPages: number;
}

export default function TaskList({ tasks, users, projectId, search, status, page, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "board">("list");
  const [query, setQuery] = useState(search);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, bulkAction] = useActionState(bulkUpdateTasks, { error: null });
  const [deleteStatus, deleteAction, deletePending] = useActionState(bulkDeleteTasks, { error: null });

  const apply = (q: string, s: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (s && s !== "ALL") params.set("status", s);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          className="flex flex-1 flex-wrap items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            apply(query, status);
          }}
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tareas…"
            className="max-w-xs"
          />
          <Select
            value={status}
            onChange={(e) => apply(query, e.target.value)}
            className="max-w-[180px]"
          >
            <option value="ALL">Todos los estados</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
        <Button onClick={() => setOpen(true)}>Nueva tarea</Button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === "list" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => setView("board")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === "board" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Tablero
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva tarea">
        <TaskForm
          projectId={projectId}
          users={users}
          onSuccess={() => setOpen(false)}
        />
      </Modal>

      {tasks.length === 0 ? (
        <EmptyState
          title="No hay tareas"
          description="Crea tu primera tarea o ajusta los filtros de búsqueda."
        />
      ) : view === "board" ? (
        <KanbanBoard tasks={tasks} />
      ) : (
        <div className="space-y-3">
          {selected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {selected.length} tarea(s) seleccionada(s)
              </span>

              <form
                action={bulkAction}
                onSubmit={(e) => {
                  if (!e.nativeEvent.defaultPrevented) {
                    const v = (e.target as HTMLFormElement).status?.value;
                    if (!v) e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="projectId" value={projectId} />
                {selected.map((id) => (
                  <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <select
                  name="status"
                  onChange={(e) => {
                    if (e.target.value) e.target.form?.requestSubmit();
                  }}
                  defaultValue=""
                  className="text-sm"
                >
                  <option value="" disabled>
                    Cambiar estado…
                  </option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </form>

              <form
                action={bulkAction}
                onSubmit={(e) => {
                  const v = (e.target as HTMLFormElement).priority?.value;
                  if (!v) e.preventDefault();
                }}
              >
                <input type="hidden" name="projectId" value={projectId} />
                {selected.map((id) => (
                  <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <select
                  name="priority"
                  onChange={(e) => {
                    if (e.target.value) e.target.form?.requestSubmit();
                  }}
                  defaultValue=""
                  className="text-sm"
                >
                  <option value="" disabled>
                    Cambiar prioridad…
                  </option>
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                </select>
              </form>

              <ConfirmDialog
                action={deleteAction}
                title="Eliminar tareas"
                message={`¿Eliminar ${selected.length} tarea(s)? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                triggerVariant="secondary"
                confirmVariant="danger"
                disabled={deletePending}
                formFields={
                  <>
                    <input type="hidden" name="projectId" value={projectId} />
                    {selected.map((id) => (
                      <input key={id} type="hidden" name="ids" value={id} />
                    ))}
                  </>
                }
                >
                  Eliminar
                </ConfirmDialog>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="text-sm underline text-gray-600 hover:text-gray-900 dark:text-gray-400"
                >
                  Limpiar
                </button>
              {bulkStatus?.error ? (
                <p className="text-sm text-red-600">{bulkStatus.error}</p>
              ) : null}
              {deleteStatus?.error ? <p className="text-sm text-red-600">{deleteStatus.error}</p> : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={tasks.length > 0 && tasks.every((t) => selected.includes(t.id))}
                onChange={(e) =>
                  setSelected(e.target.checked ? tasks.map((t) => t.id) : [])
                }
              />
              Seleccionar todo
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (
              <div key={t.id} className="relative">
                <label
                  htmlFor={`task-${t.id}`}
                  className="absolute top-3 left-3 z-10 flex h-4 w-4 cursor-pointer items-center justify-center rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                >
                  <input
                    id={`task-${t.id}`}
                    type="checkbox"
                    className="h-3 w-3 cursor-pointer"
                    checked={selected.includes(t.id)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selected, t.id]
                        : selected.filter((id) => id !== t.id);
                      setSelected(next);
                    }}
                  />
                </label>
                <TaskCard task={t} />
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}