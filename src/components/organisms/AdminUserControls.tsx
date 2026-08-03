"use client";

import { useActionState, useEffect, useRef } from "react";
import { adminDeleteUser, adminToggleStatus, adminUpdateRole } from "@/actions/admin";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { useToast } from "@/components/providers/ToastProvider";
import { ROLES, ROLE_META } from "@/lib/constants";
import type { Role, UserStatus } from "@/generated/prisma/client";
import type { ActionState } from "@/actions/admin";

interface Props {
  userId: string;
  role: Role;
  status: UserStatus;
  taskCount: number;
}

const initialState: ActionState = { error: null, message: null };

export default function AdminUserControls({ userId, role, status, taskCount }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const hasTasks = taskCount > 0;
  const { toast } = useToast();

  const [roleState, roleFormAction] = useActionState(adminUpdateRole.bind(null, userId), initialState);
  const [statusState, statusFormAction] = useActionState(adminToggleStatus.bind(null, userId), initialState);

  useEffect(() => {
    if (roleState?.message) toast(roleState.message, "success");
    else if (roleState?.error) toast(roleState.error, "error");
  }, [roleState, toast]);

  useEffect(() => {
    if (statusState?.message) toast(statusState.message, "success");
    else if (statusState?.error) toast(statusState.error, "error");
  }, [statusState, toast]);

  return (
    <div className="flex items-center gap-2">
      <form
        ref={formRef}
        action={roleFormAction}
        onChange={(e) => {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }}
      >
        <Select name="role" defaultValue={role} className="w-auto">
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_META[r].label}
            </option>
          ))}
        </Select>
      </form>
      <form action={statusFormAction}>
        <Button type="submit" variant={status === "ACTIVE" ? "secondary" : "primary"} size="sm">
          {status === "ACTIVE" ? "Desactivar" : "Activar"}
        </Button>
      </form>
      <ConfirmDialog
        action={adminDeleteUser.bind(null, userId)}
        disabled={hasTasks}
        title={hasTasks ? "No se puede eliminar" : "Eliminar usuario"}
        message={
          hasTasks
            ? `No se puede eliminar: tiene ${taskCount} tarea asignada. Reasígnalas o elimínalas primero.`
            : "¿Eliminar este usuario? Se eliminarán sus proyectos y tareas. Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar"
        triggerVariant="danger"
      >
        Eliminar
      </ConfirmDialog>
    </div>
  );
}