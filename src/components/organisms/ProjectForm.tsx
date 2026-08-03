"use client";

import { useEffect, useActionState } from "react";
import Link from "next/link";
import { createProject } from "@/actions/project";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Textarea from "@/components/atoms/Textarea";

interface Props {
  onSuccess?: () => void;
}

export default function ProjectForm({ onSuccess }: Props) {
  const [state, formAction, pending] = useActionState(createProject, {
    error: null,
    id: null,
  });

  useEffect(() => {
    if (state.id) onSuccess?.();
  }, [state.id, onSuccess]);

  if (state.id && !onSuccess) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="font-medium text-green-800">Proyecto creado correctamente.</p>
        <Link
          href={`/projects/${state.id}`}
          className="mt-2 inline-block text-sm font-medium text-green-700 underline"
        >
          Ir al proyecto
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div>
        <h2 className="font-medium text-gray-900 dark:text-gray-100">Nuevo proyecto</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Crea un proyecto y agrega miembros.</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Nombre
        </label>
        <Input id="name" name="name" required maxLength={120} placeholder="Nombre del proyecto" />
      </div>
      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="¿De qué trata este proyecto?"
        />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear proyecto"}
        </Button>
      </div>
    </form>
  );
}