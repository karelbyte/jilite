import Link from "next/link";
import TaskList from "@/components/organisms/TaskList";
import MemberManager, { type MemberItem } from "@/components/organisms/MemberManager";
import { formatDate } from "@/lib/format";
import type { TaskListItem } from "@/components/molecules/TaskCard";

interface Props {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string | Date;
    createdBy: { name: string };
  };
  tasks: TaskListItem[];
  members: MemberItem[];
  availableUsers: { id: string; name: string }[];
  assignableUsers: { id: string; name: string }[];
  canManage: boolean;
  search: string;
  status: string;
  priority: string;
  assignee: string;
  label: string;
  projectLabels: { id: string; name: string; color: string }[];
  savedViews: { id: string; name: string; filters: unknown }[];
  page: number;
  totalPages: number;
}

export default function ProjectDetailTemplate({
  project,
  tasks,
  members,
  availableUsers,
  assignableUsers,
  canManage,
  search,
  status,
  priority,
  assignee,
  label,
  projectLabels,
  savedViews,
  page,
  totalPages,
}: Props) {
  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-6">
      <Link href="/dashboard" className="text-sm font-medium text-brand-700 hover:underline">
        ← Volver a proyectos
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{project.name}</h1>
        {project.description ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span>Por {project.createdBy.name}</span>
          <span>Creado el {formatDate(project.createdAt)}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TaskList
            tasks={tasks}
            users={assignableUsers}
            projectId={project.id}
            search={search}
            status={status}
            priority={priority}
            assignee={assignee}
            label={label}
            projectLabels={projectLabels}
            savedViews={savedViews}
            page={page}
            totalPages={totalPages}
          />
        </div>
        <div>
          {canManage ? (
            <MemberManager
              projectId={project.id}
              members={members}
              availableUsers={availableUsers}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="font-medium text-gray-900 dark:text-gray-100">Miembros</h2>
              <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                {members.map((m) => (
                  <li key={m.userId} className="flex items-center gap-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    {m.user.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}