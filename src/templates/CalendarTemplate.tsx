import Link from "next/link";
import type { Priority, Status } from "@/generated/prisma/client";

export interface CalendarTask {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  projectName: string;
}

interface Props {
  year: number;
  month: number; // 1-12
  weeks: (number | null)[][];
  tasksByDay: Record<number, CalendarTask[]>;
}

export default function CalendarTemplate({ year, month, weeks, tasksByDay }: Props) {
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("es", {
    month: "long",
    year: "numeric",
  });

  const prev = new Date(year, month - 2, 1);
  const next = new Date(year, month, 1);
  const q = (d: Date) => `?y=${d.getFullYear()}&m=${d.getMonth() + 1}`;
  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 capitalize">{monthLabel}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tareas con fecha límite.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/calendar?${q(prev)}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
            ← Anterior
          </Link>
          <Link href={`/calendar?${q(next)}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
            Siguiente →
          </Link>
          <Link
            href={`/calendar?${q(new Date())}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Hoy
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 text-sm dark:border-gray-700 dark:bg-gray-800">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-400 dark:bg-gray-800 dark:text-gray-500">
            {d}
          </div>
        ))}
        {weeks.flat().map((day, i) => (
          <div key={i} className="min-h-24 bg-white p-1.5 dark:bg-gray-900">
            {day !== null ? (
              <>
                <span className="text-xs text-gray-400 dark:text-gray-500">{day}</span>
                <div className="mt-1 flex flex-col gap-1">
                  {(tasksByDay[day] ?? []).map((t) => (
                    <Link
                      key={t.id}
                      href={`/tasks/${t.id}`}
                      className={`truncate rounded px-1.5 py-0.5 text-xs ${
                        t.status === "DONE"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : t.priority === "HIGH"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                      }`}
                      title={`${t.projectName} · ${t.title}`}
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <span aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}