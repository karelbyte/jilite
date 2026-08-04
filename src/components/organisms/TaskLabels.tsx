"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLabel, updateLabel, deleteLabel, toggleTaskLabel } from "@/actions/label";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Modal from "@/components/molecules/Modal";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

interface LabelItem {
  id: string;
  name: string;
  color: string;
}

interface Props {
  taskId: string;
  projectId: string;
  labels: LabelItem[];
  allLabels: LabelItem[];
  canManage: boolean;
}

export default function TaskLabels({ taskId, projectId, labels, allLabels, canManage }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const assigned = new Set(labels.map((l) => l.id));

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createLabel(fd);
      setOpen(false);
      formRef.current?.reset();
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {allLabels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allLabels.map((l) => (
            <form key={l.id} action={toggleTaskLabel}>
              <input type="hidden" name="taskId" value={taskId} />
              <input type="hidden" name="labelId" value={l.id} />
              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  assigned.has(l.id)
                    ? "text-white"
                    : "border border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500"
                }`}
                style={assigned.has(l.id) ? { backgroundColor: l.color } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: assigned.has(l.id) ? "rgba(255,255,255,0.8)" : l.color }}
                />
                {l.name}
              </button>
            </form>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">No hay etiquetas en este proyecto.</p>
      )}

      {canManage ? (
        <div className="space-y-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          {allLabels.map((l) => (
            <div key={l.id} className="flex items-center gap-2">
              <form id={`label-update-${l.id}`} action={updateLabel} className="contents">
                <input type="hidden" name="id" value={l.id} />
              </form>
              <Input
                name="name"
                form={`label-update-${l.id}`}
                defaultValue={l.name}
                className="min-w-0 flex-1"
                maxLength={40}
              />
              <input
                type="color"
                name="color"
                form={`label-update-${l.id}`}
                defaultValue={l.color}
                aria-label={`Color de ${l.name}`}
                className="h-8 w-8 cursor-pointer rounded border border-gray-300 bg-transparent p-0.5 dark:border-gray-700"
              />
              <Button type="submit" form={`label-update-${l.id}`} size="sm" variant="secondary">
                Guardar
              </Button>
              <ConfirmDialog
                action={deleteLabel}
                title="Eliminar etiqueta"
                message={`¿Eliminar la etiqueta "${l.name}"? Se quitará de todas las tareas.`}
                confirmLabel="Eliminar"
                triggerVariant="ghost"
                confirmVariant="danger"
                size="sm"
                formFields={<input type="hidden" name="id" value={l.id} />}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-gray-300 hover:text-red-600"
                  fill="none"
                  aria-label="Eliminar etiqueta"
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
          ))}

          <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Nueva etiqueta
            </Button>

            <Modal open={open} onClose={() => setOpen(false)} title="Nueva etiqueta">
              <form ref={formRef} onSubmit={onCreate} className="space-y-4">
                <input type="hidden" name="projectId" value={projectId} />
                <div className="space-y-1">
                  <label htmlFor="label-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre
                  </label>
                  <Input id="label-name" name="name" placeholder="Nombre de la etiqueta" maxLength={40} required autoFocus />
                </div>
                <div className="space-y-1">
                  <label htmlFor="label-color" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color
                  </label>
                  <input
                    id="label-color"
                    type="color"
                    name="color"
                    defaultValue="#3b82f6"
                    aria-label="Color de la etiqueta"
                    className="h-10 w-full cursor-pointer rounded border border-gray-300 bg-transparent p-1 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={pending}>
                    {pending ? "Creando…" : "Crear etiqueta"}
                  </Button>
                </div>
              </form>
            </Modal>
          </div>
        </div>
      ) : null}
    </div>
  );
}
