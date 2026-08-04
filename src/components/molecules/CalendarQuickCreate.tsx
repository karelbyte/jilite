"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CalendarQuickCreate({
  dayISO,
  projects,
}: {
  dayISO: string;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const go = (projectId: string) => {
    setOpen(false);
    router.push(`/tasks/new?project=${encodeURIComponent(projectId)}&date=${dayISO}`);
  };

  if (projects.length === 0) return null;
  if (projects.length === 1) {
    return (
      <button
        type="button"
        aria-label={`Crear tarea para el ${dayISO}`}
        onClick={() => go(projects[0].id)}
        className="invisible rounded-md px-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 group-hover:visible dark:text-brand-400 dark:hover:bg-brand-900/30"
      >
        + Nueva
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Crear tarea para el ${dayISO}`}
        onClick={() => setOpen((v) => !v)}
        className="invisible rounded-md px-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 group-hover:visible dark:text-brand-400 dark:hover:bg-brand-900/30"
      >
        + Nueva
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute left-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => go(p.id)}
                  className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
