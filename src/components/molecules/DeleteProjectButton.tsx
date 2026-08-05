"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/actions/project";
import Button from "@/components/atoms/Button";
import Modal from "@/components/molecules/Modal";
import { useToast } from "@/components/providers/ToastProvider";

export default function DeleteProjectButton({
  projectId,
  hasTasks,
}: {
  projectId: string;
  hasTasks: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteProject(projectId);
      if (res?.error) {
        toast(res.error, "error");
        setOpen(false);
        return;
      }
      toast("Proyecto eliminado", "success");
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={hasTasks}
        title={
          hasTasks
            ? "Para eliminar el proyecto primero eliminá todas sus tareas."
            : "Eliminar proyecto"
        }
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Eliminar proyecto
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Eliminar proyecto">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {hasTasks
            ? "El proyecto aún tiene tareas. Para eliminarlo, primero eliminá todas sus tareas."
            : "¿Seguro que querés eliminar este proyecto? Se eliminará de forma permanente y no se puede deshacer."}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" size="sm" disabled={pending || hasTasks} onClick={onDelete}>
            {pending ? "Eliminando…" : "Eliminar"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
