"use client";

import { useActionState } from "react";
import Link from "next/link";
import { acceptInvitationAction } from "@/actions/invitation";
import Button from "@/components/atoms/Button";

export default function AcceptInviteForm({ token, projectName }: { token: string; projectName: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitationAction, {
    ok: false,
    message: "",
  });

  return (
    <div className="space-y-4">
      {state?.message ? (
        <p
          className={`rounded-lg border px-4 py-2 text-sm ${
            state.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          ¿Quieres unirte a <strong>{projectName}</strong>? Se te agregará como miembro con tu email actual.
        </p>
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </Link>
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {pending ? "Uniendo…" : "Unirse al proyecto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
