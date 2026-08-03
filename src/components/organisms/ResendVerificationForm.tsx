"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "@/actions/auth";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

export default function ResendVerificationForm() {
  const [state, formAction, pending] = useActionState(resendVerificationAction, {
    error: null,
    message: null,
  });

  return (
    <div className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-800">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        ¿No recibiste el correo de verificación?
      </p>
      <form action={formAction} className="mt-2 space-y-4">
        <div className="space-y-1">
          <label htmlFor="resend-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Correo
          </label>
          <Input
            id="resend-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@correo.com"
          />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
        <Button type="submit" disabled={pending} className="w-full" variant="secondary">
          {pending ? "Enviando…" : "Reenviar correo de verificación"}
        </Button>
      </form>
    </div>
  );
}
