"use client";

import { useState, useActionState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import Pagination from "@/components/molecules/Pagination";
import Modal from "@/components/molecules/Modal";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import TaskCard, { type TaskListItem } from "@/components/molecules/TaskCard";
import EmptyState from "@/components/molecules/EmptyState";
import KanbanBoard from "@/components/organisms/KanbanBoard";
import { bulkUpdateTasks, bulkDeleteTasks } from "@/actions/task";
import { saveViewAction } from "@/actions/view";
import { STATUSES, STATUS_META } from "@/lib/constants";

interface Props {
  tasks: TaskListItem[];
  users: { id: string; name: string }[];
  projectId: string;
  search: string;
  status: string;
  priority?: string;
  assignee?: string;
  label?: string;
  projectLabels?: { id: string; name: string; color: string }[];
  savedViews?: { id: string; name: string; filters: unknown }[];
  page: number;
  totalPages: number;
  canEdit?: boolean;
}

export default function TaskList({
  tasks,
  users,
  projectId,
  search,
  status,
  priority = "ALL",
  assignee = "",
  label = "",
  projectLabels = [],
  savedViews = [],
  page,
  totalPages,
  canEdit = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<"list" | "board">("list");
  const [query, setQuery] = useState(search);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, bulkAction] = useActionState(bulkUpdateTasks, { error: null });
  const [deleteStatus, deleteAction, deletePending] = useActionState(bulkDeleteTasks, { error: null });
  const [viewState, viewAction] = useActionState(saveViewAction, { error: null, message: null });
  const [viewName, setViewName] = useState("");
  const [showSaveView, setShowSaveView] = useState(false);

  const apply = (filters: { q?: string; s?: string; p?: string; a?: string; l?: string }) => {
    const params = new URLSearchParams();
    const q = filters.q ?? query;
    if (q.trim()) params.set("q", q.trim());
    if (filters.s && filters.s !== "ALL") params.set("status", filters.s);
    if (filters.p && filters.p !== "ALL") params.set("priority", filters.p);
    if (filters.a) params.set("assignee", filters.a);
    if (filters.l) params.set("label", filters.l);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          className="flex flex-1 flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: query, s: status, p: priority, a: assignee, l: label });
          }}
        >
          <div className="space-y-1">
            <label htmlFor="tl-q" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Buscar
            </label>
            <Input
              id="tl-q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Título o descripción…"
              className="max-w-xs"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="tl-status" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Estado
            </label>
            <Select
              id="tl-status"
              value={status}
              onChange={(e) => apply({ s: e.target.value, q: query, p: priority, a: assignee, l: label })}
              className="max-w-[160px]"
            >
              <option value="ALL">Todos</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="tl-priority" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Prioridad
            </label>
            <Select
              id="tl-priority"
              value={priority}
              onChange={(e) => apply({ p: e.target.value, q: query, s: status, a: assignee, l: label })}
              className="max-w-[150px]"
            >
              <option value="ALL">Todas</option>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </Select>
          </div>
          {users.length > 0 ? (
            <div className="space-y-1">
              <label htmlFor="tl-assignee" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Asignado
              </label>
              <Select
                id="tl-assignee"
                value={assignee}
                onChange={(e) => apply({ a: e.target.value, q: query, s: status, p: priority, l: label })}
                className="max-w-[180px]"
              >
                <option value="">Todos</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          {projectLabels.length > 0 ? (
            <div className="space-y-1">
              <label htmlFor="tl-label" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Etiqueta
              </label>
              <Select
                id="tl-label"
                value={label}
                onChange={(e) => apply({ l: e.target.value, q: query, s: status, p: priority, a: assignee })}
                className="max-w-[180px]"
              >
                <option value="">Todas</option>
                {projectLabels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <Button
            type="submit"
            variant="secondary"
            aria-label="Buscar tareas"
            title="Buscar tareas"
            className="self-end px-3"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          <div className="flex items-center gap-2">
            {savedViews.length > 0 ? (
              <Select
                value=""
                onChange={(e) => {
                  const v = savedViews.find((s) => s.id === e.target.value);
                  if (!v) return;
                  const f = (v.filters ?? {}) as Record<string, string>;
                  apply({ q: f.q ?? "", s: f.s ?? "ALL", p: f.p ?? "ALL", a: f.a ?? "", l: f.l ?? "" });
                }}
                className="max-w-[160px]"
                aria-label="Vistas guardadas"
              >
                <option value="" disabled>
                  Vistas guardadas
                </option>
                {savedViews.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSaveView((x) => !x)}
              aria-label="Guardar vista"
              title={showSaveView ? "Cancelar" : "Guardar vista"}
              className="self-end px-3"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </form>
        <Modal open={showSaveView} onClose={() => setShowSaveView(false)} title="Guardar vista">
          <form
            action={viewAction}
            onSubmit={() => setTimeout(() => setShowSaveView(false), 0)}
            className="space-y-4"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <input
              type="hidden"
              name="filters"
              value={JSON.stringify({
                q: search,
                s: status,
                p: priority,
                a: assignee,
                l: label,
              })}
            />
            <div className="space-y-1">
              <label htmlFor="view-name" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Nombre de la vista
              </label>
              <Input
                id="view-name"
                name="name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                required
                autoFocus
                placeholder="Ej: Sprint actual"
                maxLength={50}
              />
            </div>
            {viewState?.error ? <p className="text-sm text-red-600">{viewState.error}</p> : null}
            {viewState?.message ? <p className="text-sm text-green-700">{viewState.message}</p> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowSaveView(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={!viewName.trim()}>
                Guardar
              </Button>
            </div>
          </form>
        </Modal>
        {canEdit ? (
          <Link href={`/tasks/new?project=${encodeURIComponent(projectId)}`} className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Nueva tarea
          </Link>
        ) : null}
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

      {tasks.length === 0 ? (
        <EmptyState
          title="No hay tareas"
          description="Crea tu primera tarea o ajusta los filtros de búsqueda."
        />
      ) : view === "board" ? (
        <KanbanBoard tasks={tasks} canEdit={canEdit} />
      ) : (
        <div className="space-y-3">
          {canEdit && selected.length > 0 ? (
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

          {canEdit ? (
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
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (
              <div key={t.id} className="relative">
                {canEdit ? (
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
                ) : null}
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