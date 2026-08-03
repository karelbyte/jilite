"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {
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
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}