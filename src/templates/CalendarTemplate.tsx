import Link from "next/link";
import CalendarQuickCreate from "@/components/molecules/CalendarQuickCreate";
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
  view: "month" | "week";
  weeks: (number | null)[][];
  weekDays: { iso: string; label: string }[];
  tasksByISO: Record<string, CalendarTask[]>;
  projects: { id: string; name: string }[];
}

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function taskClasses(t: CalendarTask) {
  return t.status === "DONE"
    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
    : t.priority === "HIGH"
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      : "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300";
}

export default function CalendarTemplate({
  year,
  month,
  view,
  weeks,
  weekDays,
  tasksByISO,
  projects,
}: Props) {
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("es", {
    month: "long",
    year: "numeric",
  });

  const prev = view === "week" ? new Date(year, month - 1, 1) : new Date(year, month - 2, 1);
  const next = view === "week" ? new Date(year, month, 1) : new Date(year, month, 1);
  const q = (d: Date, v: string) => `?y=${d.getFullYear()}&m=${d.getMonth() + 1}&view=${v}`;

  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 capitalize">{monthLabel}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tareas con fecha límite. Pasá el mouse sobre un día para crear una tarea.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-1 flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
            <Link
              href={`/calendar?${q(new Date(), "month")}`}
              className={`px-3 py-1.5 text-sm ${
                view === "month"
                  ? "bg-brand-600 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Mes
            </Link>
            <Link
              href={`/calendar?${q(new Date(), "week")}`}
              className={`px-3 py-1.5 text-sm ${
                view === "week"
                  ? "bg-brand-600 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Semana
            </Link>
          </div>
          <Link
            href={`/calendar?${q(prev, view)}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            ← Anterior
          </Link>
          <Link
            href={`/calendar?${q(next, view)}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Siguiente →
          </Link>
          <Link
            href={`/calendar?${q(new Date(), view)}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Hoy
          </Link>
          <a
            href="/api/calendar.ics"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Exportar ICS
          </a>
        </div>
      </div>

      {view === "week" ? (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 text-sm dark:border-gray-700 dark:bg-gray-800">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div
              key={d}
              className="bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            >
              {d}
            </div>
          ))}
          {weekDays.map((w) => (
            <div key={w.iso} className="group min-h-48 bg-white p-1.5 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{w.label}</span>
                <CalendarQuickCreate dayISO={w.iso} projects={projects} />
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {(tasksByISO[w.iso] ?? []).map((t) => (
                  <Link
                    key={t.id}
                    href={`/tasks/${t.id}`}
                    className={`truncate rounded px-1.5 py-0.5 text-xs ${taskClasses(t)}`}
                    title={`${t.projectName} · ${t.title}`}
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 text-sm dark:border-gray-700 dark:bg-gray-800">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div
              key={d}
              className="bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            >
              {d}
            </div>
          ))}
          {weeks.flat().map((day, i) => {
            if (day === null) {
              return (
                <div key={i} className="min-h-24 bg-white p-1.5 dark:bg-gray-900">
                  <span aria-hidden="true" />
                </div>
              );
            }
            const dayISO = iso(year, month, day);
            return (
              <div key={i} className="group min-h-24 bg-white p-1.5 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{day}</span>
                  <CalendarQuickCreate dayISO={dayISO} projects={projects} />
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {(tasksByISO[dayISO] ?? []).map((t) => (
                    <Link
                      key={t.id}
                      href={`/tasks/${t.id}`}
                      className={`truncate rounded px-1.5 py-0.5 text-xs ${taskClasses(t)}`}
                      title={`${t.projectName} · ${t.title}`}
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
