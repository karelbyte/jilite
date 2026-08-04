import { createSubtask, toggleSubtask, deleteSubtask } from "@/actions/subtask";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

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

  return (
    <div className="space-y-3">
      {subtasks.length > 0 ? (
        <div className="mb-2 text-xs text-gray-400 dark:text-gray-500">
          {doneCount} de {subtasks.length} completadas
        </div>
      ) : null}
      <ul className="space-y-1.5">
        {subtasks.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <form action={toggleSubtask} className="flex items-center gap-2">
              <input type="hidden" name="subtaskId" value={s.id} />
              <button
                type="submit"
                aria-label={s.done ? "Marcar como pendiente" : "Marcar como completada"}
                aria-pressed={s.done}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  s.done ? "border-green-500 bg-green-500" : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {s.done ? (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            </form>

            <span className={`flex-1 text-sm ${s.done ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
              {s.title}
            </span>

             <ConfirmDialog
               action={deleteSubtask}
               title="Eliminar subtarea"
               message="¿Seguro que quieres eliminar esta subtarea?"
               confirmLabel="Eliminar"
               triggerVariant="ghost"
               confirmVariant="danger"
               size="sm"
               formFields={<input type="hidden" name="subtaskId" value={s.id} />}
             >
               <svg
                 viewBox="0 0 24 24"
                 className="h-4 w-4 text-gray-300 hover:text-red-600"
                 fill="none"
                 aria-label="Eliminar subtarea"
               >
                 <path
                   d="M6 6l12 12M18 6L6 18"
                   stroke="currentColor"
                   strokeWidth="2"
                   strokeLinecap="round"
                 />
               </svg>
             </ConfirmDialog>
          </li>
        ))}
      </ul>

      <form action={createSubtask} className="flex items-center gap-2">
        <input type="hidden" name="taskId" value={taskId} />
        <Input name="title" placeholder="Nueva subtarea…" className="flex-1" maxLength={200} />
        <Button type="submit" size="sm">
          Añadir
        </Button>
      </form>
    </div>
  );
}