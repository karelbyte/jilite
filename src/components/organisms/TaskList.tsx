"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import Modal from "@/components/molecules/Modal";
import Pagination from "@/components/molecules/Pagination";
import TaskCard, { type TaskListItem } from "@/components/molecules/TaskCard";
import EmptyState from "@/components/molecules/EmptyState";
import KanbanBoard from "@/components/organisms/KanbanBoard";
import TaskForm from "@/components/organisms/TaskForm";
import { STATUSES, STATUS_META } from "@/lib/constants";

interface Props {
  tasks: TaskListItem[];
  users: { id: string; name: string }[];
  projectId: string;
  search: string;
  status: string;
  page: number;
  totalPages: number;
}

export default function TaskList({ tasks, users, projectId, search, status, page, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "board">("list");
  const [query, setQuery] = useState(search);

  const apply = (q: string, s: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (s && s !== "ALL") params.set("status", s);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          className="flex flex-1 flex-wrap items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            apply(query, status);
          }}
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tareas…"
            className="max-w-xs"
          />
          <Select
            value={status}
            onChange={(e) => apply(query, e.target.value)}
            className="max-w-[180px]"
          >
            <option value="ALL">Todos los estados</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
        <Button onClick={() => setOpen(true)}>Nueva tarea</Button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === "list" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => setView("board")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === "board" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tablero
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva tarea">
        <TaskForm
          projectId={projectId}
          users={users}
          onSuccess={() => setOpen(false)}
        />
      </Modal>

      {tasks.length === 0 ? (
        <EmptyState
          title="No hay tareas"
          description="Crea tu primera tarea o ajusta los filtros de búsqueda."
        />
      ) : view === "board" ? (
        <KanbanBoard tasks={tasks} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}