import Link from "next/link";
import Avatar from "@/components/atoms/Avatar";

export interface ProjectCardItem {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  taskCount: number;
  createdBy: { name: string; image: string | null };
  createdAt: string | Date;
}

export default function ProjectCard({ project }: { project: ProjectCardItem }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
          </svg>
        </span>
      </div>
      <h3 className="mt-3 font-medium text-gray-900 line-clamp-1 dark:text-gray-100">{project.name}</h3>
      {project.description ? (
        <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">{project.description}</p>
      ) : null}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
        <span className="flex items-center gap-2">
          <Avatar name={project.createdBy.name} src={project.createdBy.image} size="sm" />
          {project.createdBy.name.split(" ")[0]}
        </span>
        <span>
          {project.taskCount} tareas · {project.memberCount} miembros
        </span>
      </div>
    </Link>
  );
}