"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Tab {
  id: string;
  label: string;
}

const TABS: Tab[] = [
  { id: "tareas", label: "Tareas" },
  { id: "miembros", label: "Miembros" },
  { id: "archivos", label: "Archivos" },
  { id: "actividad", label: "Actividad" },
];

export default function ProjectTabs({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const go = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div
      role="tablist"
      className="mt-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700"
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => go(t.id)}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-brand-600 text-brand-700 dark:border-brand-500 dark:text-brand-300"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
