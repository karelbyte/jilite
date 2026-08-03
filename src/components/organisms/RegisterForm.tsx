"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, {
    error: null,
    message: null,
  });

  if (state?.message) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
        <p className="font-medium">{state.message}</p>
        <p className="mt-3">
          <Link href="/login" className="font-medium text-green-700 underline">
            Ir a iniciar sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Nombre
        </label>
        <Input id="name" name="name" autoComplete="name" required placeholder="Tu nombre" />
      </div>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Correo
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Contraseña
        </label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Mín. 8, con mayúscula, número y símbolo" />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}