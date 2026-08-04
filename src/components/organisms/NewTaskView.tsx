"use client";

import { useState } from "react";
import Link from "next/link";
import TaskForm from "@/components/organisms/TaskForm";
import FileUploader from "@/components/organisms/FileUploader";

interface Props {
  projectId: string;
  users: { id: string; name: string }[];
  defaultDueDate?: string;
}

export default function NewTaskView({ projectId, users, defaultDueDate }: Props) {
  const [createdId, setCreatedId] = useState<string | null>(null);

  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-6">
      <Link
        href={`/projects/${projectId}`}
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        ← Volver al proyecto
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">Nueva tarea</h1>

        <TaskForm
          projectId={projectId}
          users={users}
          defaultDueDate={defaultDueDate}
          onCreated={(id) => setCreatedId(id)}
        />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Archivos</h2>
        {createdId ? (
          <FileUploader taskId={createdId} />
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Creá la tarea para poder adjuntar archivos.
          </p>
        )}
        {createdId ? (
          <div className="mt-6 flex gap-3">
            <Link
              href={`/tasks/${createdId}`}
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Ver la tarea
            </Link>
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Volver al proyecto
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
