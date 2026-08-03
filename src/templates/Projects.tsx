import type { ProjectCardItem } from "@/components/molecules/ProjectCard";
import ProjectCard from "@/components/molecules/ProjectCard";
import EmptyState from "@/components/molecules/EmptyState";
import Pagination from "@/components/molecules/Pagination";
import NewProjectModal from "@/components/organisms/NewProjectModal";

interface Props {
  projects: ProjectCardItem[];
  canCreate: boolean;
  page: number;
  totalPages: number;
}

export default function ProjectsTemplate({ projects, canCreate, page, totalPages }: Props) {
  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Proyectos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tus proyectos y las tareas de tu equipo.</p>
        </div>
        {canCreate ? <NewProjectModal /> : null}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Sin proyectos"
          description="Todavía no tienes proyectos asignados."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </main>
  );
}