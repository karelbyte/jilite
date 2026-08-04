"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSubtask, toggleSubtask, deleteSubtask, moveSubtask } from "@/actions/subtask";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Modal from "@/components/molecules/Modal";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

interface Subtask {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | Date | null;
  estimateMinutes: number | null;
}

interface Props {
  taskId: string;
  subtasks: Subtask[];
  canEdit?: boolean;
}

function formatEstimate(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatDue(dueDate: string | Date): string {
  const d = new Date(dueDate);
  const overdue = d < new Date();
  const label = d.toLocaleDateString("es", { day: "numeric", month: "short" });
  return `${label}${overdue ? " (vencida)" : ""}`;
}

export default function SubtaskList({ taskId, subtasks, canEdit = true }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const doneCount = subtasks.filter((s) => s.done).length;
  const totalMinutes = subtasks.reduce((acc, s) => acc + (s.estimateMinutes ?? 0), 0);

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createSubtask(fd);
      setOpen(false);
      formRef.current?.reset();
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {subtasks.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span>
            {doneCount} de {subtasks.length} completadas
          </span>
          {totalMinutes > 0 ? <span>Estimación total: {formatEstimate(totalMinutes)}</span> : null}
        </div>
      ) : null}
      <ul className="space-y-1.5">
        {subtasks.map((s, i) => {
          const due = s.dueDate
            ? new Date(s.dueDate) < new Date() && !s.done
            : false;
          return (
            <li key={s.id} className="flex items-center gap-2">
              {canEdit ? (
                <form action={toggleSubtask} className="flex items-center gap-2">
                  <input type="hidden" name="subtaskId" value={s.id} />
                  <button
                    type="submit"
                    aria-label={s.done ? "Marcar como pendiente" : "Marcar como completada"}
                    aria-pressed={s.done}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      s.done ? "border-green-500 bg-green-500" : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {s.done ? (
                      <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                </form>
              ) : s.done ? (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-green-500 bg-green-500">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              ) : (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600" />
              )}

              <span className={`flex-1 text-sm ${s.done ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                {s.title}
              </span>

              {s.dueDate ? (
                <span className={`rounded-full px-2 py-0.5 text-xs ${due ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                  {formatDue(s.dueDate)}
                </span>
              ) : null}
              {s.estimateMinutes ? (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {formatEstimate(s.estimateMinutes)}
                </span>
              ) : null}

              {canEdit ? (
                <div className="flex items-center gap-0.5">
                  <form action={moveSubtask}>
                    <input type="hidden" name="subtaskId" value={s.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={i === 0}
                      aria-label="Subir"
                      className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 dark:hover:text-gray-200"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path d="M5 15l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </form>
                  <form action={moveSubtask}>
                    <input type="hidden" name="subtaskId" value={s.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={i === subtasks.length - 1}
                      aria-label="Bajar"
                      className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 dark:hover:text-gray-200"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </form>
                </div>
              ) : null}

              {canEdit ? (
                <ConfirmDialog
                  action={deleteSubtask}
                  title="Eliminar subtarea"
                  message="¿Seguro que quieres eliminar esta subtarea?"
                  confirmLabel="Eliminar"
                  triggerVariant="ghost"
                  confirmVariant="danger"
                  size="sm"
                  formFields={<input type="hidden" name="subtaskId" value={s.id} />}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-gray-300 hover:text-red-600"
                    fill="none"
                    aria-label="Eliminar subtarea"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </ConfirmDialog>
              ) : null}
            </li>
          );
        })}
      </ul>

      {canEdit ? (
        <>
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            Añadir subtarea
          </Button>

          <Modal open={open} onClose={() => setOpen(false)} title="Nueva subtarea">
            <form ref={formRef} onSubmit={onCreate} className="space-y-4">
              <input type="hidden" name="taskId" value={taskId} />
              <div className="space-y-1">
                <label htmlFor="subtask-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Título
                </label>
                <Input id="subtask-title" name="title" placeholder="Título de la subtarea" maxLength={200} required autoFocus />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="subtask-due" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha límite
                  </label>
                  <Input id="subtask-due" name="dueDate" type="date" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="subtask-estimate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estimación (minutos)
                  </label>
                  <Input id="subtask-estimate" name="estimateMinutes" type="number" min={0} step={5} placeholder="30" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Creando…" : "Crear subtarea"}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      ) : null}
    </div>
  );
}
