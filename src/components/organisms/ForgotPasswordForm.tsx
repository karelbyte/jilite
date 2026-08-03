"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/actions/auth";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, {
    error: null,
    message: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Correo
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}
