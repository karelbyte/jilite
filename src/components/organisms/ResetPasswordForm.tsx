"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/actions/auth";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, {
    error: null,
    message: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Nueva contraseña
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
        />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando…" : "Restablecer contraseña"}
      </Button>
    </form>
  );
}