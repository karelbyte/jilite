"use client";

import { useActionState, useEffect, useState } from "react";
import Modal from "@/components/molecules/Modal";
import Button from "@/components/atoms/Button";
import { useToast } from "@/components/providers/ToastProvider";
import type { ActionState } from "@/actions/admin";

interface Props {
  action:
    | ((prevState: ActionState, formData: FormData) => ActionState | Promise<ActionState>)
    | ((formData: FormData) => void | Promise<void>);
  title: string;
  message: string;
  confirmLabel?: string;
  triggerVariant?: "primary" | "secondary" | "danger" | "ghost";
  confirmVariant?: "primary" | "secondary" | "danger" | "ghost";
  confirmSize?: "sm" | "md";
  size?: "sm" | "md";
  disabled?: boolean;
  children: React.ReactNode;
}

export default function ConfirmDialog({
  action,
  title,
  message,
  confirmLabel = "Confirmar",
  triggerVariant = "secondary",
  confirmVariant = "danger",
  confirmSize = "sm",
  size = "sm",
  disabled = false,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const statefulAction = action as (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  const [state, formAction, pending] = useActionState(statefulAction, {
    error: null,
    message: null,
  });

  useEffect(() => {
    if (state?.error) toast(state.error, "error");
    else if (state?.message) toast(state.message, "success");
  }, [state, toast]);

  return (
    <>
      <Button type="button" variant={triggerVariant} size={size} disabled={disabled} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        <form action={formAction} className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={confirmVariant}
            size={confirmSize}
            disabled={pending}
            onClick={() => setTimeout(() => setOpen(false), 0)}
          >
            {pending ? "Procesando…" : confirmLabel}
          </Button>
        </form>
      </Modal>
    </>
  );
}