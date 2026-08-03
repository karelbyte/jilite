import { createSubtask, toggleSubtask, deleteSubtask } from "@/actions/subtask";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

interface Props {
  taskId: string;
  subtasks: Subtask[];
}

export default function SubtaskList({ taskId, subtasks }: Props) {
  const doneCount = subtasks.filter((s) => s.done).length;

  async function createAction(fd: FormData) {
    await createSubtask(fd);
  }
  async function toggleAction(fd: FormData) {
    await toggleSubtask(fd);
  }
  async function deleteAction(fd: FormData) {
    await deleteSubtask(fd);
  }

  return (
    <div className="space-y-3">
      {subtasks.length > 0 ? (
        <div className="mb-2 text-xs text-gray-400">
          {doneCount} de {subtasks.length} completadas
        </div>
      ) : null}
      <ul className="space-y-1.5">
        {subtasks.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <form action={toggleAction} className="flex items-center gap-2">
              <input type="hidden" name="subtaskId" value={s.id} />
              <button
                type="submit"
                aria-label={s.done ? "Marcar como pendiente" : "Marcar como completada"}
                aria-pressed={s.done}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  s.done ? "border-green-500 bg-green-500" : "border-gray-300"
                }`}
              >
                {s.done ? (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            </form>

            <span className={`flex-1 text-sm ${s.done ? "text-gray-400 line-through" : "text-gray-700"}`}>
              {s.title}
            </span>

            <form action={deleteAction}>
              <input type="hidden" name="subtaskId" value={s.id} />
              <button
                type="submit"
                aria-label="Eliminar subtarea"
                className="text-gray-300 hover:text-red-600"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form action={createAction} className="flex items-center gap-2">
        <input type="hidden" name="taskId" value={taskId} />
        <Input name="title" placeholder="Nueva subtarea…" className="flex-1" maxLength={200} />
        <Button type="submit" size="sm">
          Añadir
        </Button>
      </form>
    </div>
  );
}