"use client";

import { useActionState, useRef, useEffect } from "react";
import { adminCreateUser } from "@/actions/admin";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { ROLES, ROLE_META } from "@/lib/constants";

interface Props {
  onSuccess?: () => void;
}

export default function AdminUserForm({ onSuccess }: Props) {
  const [state, formAction, pending] = useActionState(adminCreateUser, {
    error: null,
    message: null,
  });
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (wasPending.current) {
      wasPending.current = false;
      if (!state.error) onSuccess?.();
    }
  }, [pending, state.error, onSuccess]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div>
        <h2 className="font-medium text-gray-900 dark:text-gray-100">Crear usuario</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">El admin crea usuarios y define su rol y estado.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre
          </label>
          <Input id="name" name="name" required placeholder="Nombre completo" />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Correo
          </label>
          <Input id="email" name="email" type="email" required placeholder="tu@correo.com" />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Contraseña
          </label>
          <Input id="password" name="password" type="password" required minLength={8} placeholder="Mín. 8, con mayúscula, número y símbolo" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rol
            </label>
            <Select id="role" name="role" defaultValue="USER">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r].label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado
            </label>
            <Select id="status" name="status" defaultValue="ACTIVE">
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </Select>
          </div>
        </div>
      </div>
      {state?.message ? (
        <p className="text-sm text-green-600">{state.message}</p>
      ) : state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}