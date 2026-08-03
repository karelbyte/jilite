"use client";

import { useActionState } from "react";
import { updateTaskStatus } from "@/actions/task";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import { STATUSES, STATUS_META } from "@/lib/constants";
import type { Status } from "@/generated/prisma/client";

interface Props {
  taskId: string;
  status: Status;
}

export default function StatusSelect({ taskId, status }: Props) {
  const [state, formAction, pending] = useActionState(updateTaskStatus, { error: null });

  return (
    <form action={formAction} className="flex items-end gap-3">
      <input type="hidden" name="id" value={taskId} />
      <div className="flex-1 space-y-1">
        <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Estado
        </label>
        <Select id="status" name="status" defaultValue={status}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Actualizar estado"}
      </Button>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}