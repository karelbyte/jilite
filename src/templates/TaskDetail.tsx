import Link from "next/link";
import type { Comment } from "@/generated/prisma/client";
import Badge from "@/components/atoms/Badge";
import Avatar from "@/components/atoms/Avatar";
import CommentList from "@/components/organisms/CommentList";
import CommentForm from "@/components/organisms/CommentForm";
import FileList from "@/components/organisms/FileList";
import FileUploader from "@/components/organisms/FileUploader";
import TaskEditor from "@/components/organisms/TaskEditor";
import TaskLabels from "@/components/organisms/TaskLabels";
import SubtaskList from "@/components/organisms/SubtaskList";
import StatusSelect from "@/components/molecules/StatusSelect";
import { PRIORITY_META, STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/format";

interface Props {
  task: {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH";
    assigneeId: string | null;
    dueDate: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    createdBy: { name: string; image: string | null };
    assignee: { name: string; image: string | null } | null;
  };
  comments: Array<
    Pick<Comment, "id" | "body" | "createdAt"> & {
      author: { name: string; image: string | null };
    }
  >;
  files: Array<{ id: string; name: string; contentType: string }>;
  labels: Array<{ id: string; name: string; color: string }>;
  allLabels: Array<{ id: string; name: string; color: string }>;
  subtasks: Array<{ id: string; title: string; done: boolean }>;
  canManageLabels: boolean;
  users: { id: string; name: string }[];
  canEditFull: boolean;
  statusOnly: boolean;
}

export default function TaskDetailTemplate({
  task,
  comments,
  files,
  labels,
  allLabels,
  subtasks,
  canManageLabels,
  users,
  canEditFull,
  statusOnly,
}: Props) {
  const status = STATUS_META[task.status];
  const priority = PRIORITY_META[task.priority];

  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-6">
      <Link href={`/projects/${task.projectId}`} className="text-sm font-medium text-brand-700 hover:underline">
        ← Volver al proyecto
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className={priority.className}>{priority.label}</Badge>
          <Badge className={status.className}>{status.label}</Badge>
          {task.dueDate ? (
            <Badge className={new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}>
              Vence: {formatDate(task.dueDate)}
            </Badge>
          ) : null}
        </div>

        {canEditFull ? (
          <TaskEditor
            task={{
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              assigneeId: task.assigneeId,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
            }}
            users={users}
          />
        ) : (
          <div>
            {statusOnly ? (
              <div className="mb-4 max-w-xs">
                <StatusSelect taskId={task.id} status={task.status} />
              </div>
            ) : null}
            <h1 className="text-2xl font-semibold text-gray-900">{task.title}</h1>
            {task.description ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{task.description}</p>
            ) : null}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 text-xs text-gray-400">
          <span className="flex items-center gap-2">
            Creada por
            <Avatar name={task.createdBy.name} src={task.createdBy.image} size="sm" />
            {task.createdBy.name}
          </span>
          {task.assignee ? (
            <span className="flex items-center gap-2">
              Asignada a
              <Avatar name={task.assignee.name} src={task.assignee.image} size="sm" />
              {task.assignee.name}
            </span>
          ) : null}
          <span>Actualizada {formatDate(task.updatedAt)}</span>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Subtareas</h2>
        <SubtaskList taskId={task.id} subtasks={subtasks} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Etiquetas</h2>
        <TaskLabels
          taskId={task.id}
          projectId={task.projectId}
          labels={labels}
          allLabels={allLabels}
          canManage={canManageLabels}
        />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Archivos</h2>
        <FileUploader taskId={task.id} />
        <div className="mt-4">
          <FileList files={files} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Comentarios</h2>
        <div className="mb-5">
          <CommentForm taskId={task.id} />
        </div>
        <CommentList comments={comments} />
      </section>
    </main>
  );
}