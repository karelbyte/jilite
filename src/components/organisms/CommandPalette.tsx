"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/atoms/Avatar";

interface TaskHit {
  id: string;
  title: string;
  status: string;
  projectName: string;
}
interface ProjectHit {
  id: string;
  name: string;
}
interface UserHit {
  id: string;
  name: string;
  email: string;
  image: string | null;
}
interface FileHit {
  id: string;
  name: string;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
  projectName: string;
}

interface Results {
  tasks: TaskHit[];
  projects: ProjectHit[];
  users: UserHit[];
  files: FileHit[];
}

type NavItem = { kind: "task" | "project" | "file"; label: string; sub: string; href: string };

const STATUS_LABEL: Record<string, string> = {
  TODO: "Por hacer",
  IN_PROGRESS: "En curso",
  DONE: "Completada",
};

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ tasks: [], projects: [], users: [], files: [] });
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setActive(0);
      inputRef.current?.focus();
    }, 10);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults({ tasks: [], projects: [], users: [], files: [] });
        return;
      }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        if (!res.ok) return;
        setResults((await res.json()) as Results);
      } catch {
        // red de búsqueda no disponible
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const nav: NavItem[] = [
    ...results.tasks.map((t) => ({
      kind: "task" as const,
      label: t.title,
      sub: `${STATUS_LABEL[t.status] ?? t.status} · ${t.projectName}`,
      href: `/tasks/${t.id}`,
    })),
    ...results.projects.map((p) => ({
      kind: "project" as const,
      label: p.name,
      sub: "Proyecto",
      href: `/projects/${p.id}`,
    })),
    ...results.files.map((f) => ({
      kind: "file" as const,
      label: f.name,
      sub: f.taskId ? `${f.projectName} · ${f.taskTitle}` : `${f.projectName} · Documento del proyecto`,
      href: f.taskId ? `/tasks/${f.taskId}` : `/projects/${f.projectId}`,
    })),
  ];

  const go = (item: NavItem) => {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, nav.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = nav[active];
      if (item) go(item);
    }
  };

  if (!open) return null;

  const hasAny = nav.length > 0 || results.users.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gray-400" fill="none" aria-hidden="true">
            <path
              d="M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar tareas, proyectos, archivos… (Esc para cerrar)"
            className="w-full bg-transparent py-3 text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-100"
          />
          <kbd className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-600">⌘K</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2" onMouseMove={() => setActive(-1)}>
          {query.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-400">
              Escribí al menos 2 letras para buscar.
            </p>
          ) : !hasAny ? (
            <p className="px-3 py-6 text-center text-sm text-gray-400">Sin resultados.</p>
          ) : (
            <>
              {nav.map((item, i) => (
                <button
                  key={`${item.kind}-${item.label}-${i}`}
                  type="button"
                  onClick={() => go(item)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                    active === i ? "bg-brand-50 dark:bg-brand-900/30" : ""
                  }`}
                >
                  <span className="w-1.5 shrink-0 self-stretch rounded-full bg-gray-200 dark:bg-gray-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
                    <span className="block truncate text-xs text-gray-400">{item.sub}</span>
                  </span>
                </button>
              ))}
              {results.users.length > 0 ? (
                <div className="mt-2 border-t border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
                  Usuarios
                </div>
              ) : null}
              {results.users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg px-3 py-2">
                  <Avatar name={u.name} src={u.image} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">{u.name}</span>
                    <span className="block truncate text-xs text-gray-400">{u.email}</span>
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
