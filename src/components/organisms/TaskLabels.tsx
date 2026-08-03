import { createLabel, toggleTaskLabel } from "@/actions/label";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

interface LabelItem {
  id: string;
  name: string;
  color: string;
}

interface Props {
  taskId: string;
  projectId: string;
  labels: LabelItem[];
  allLabels: LabelItem[];
  canManage: boolean;
}

export default function TaskLabels({ taskId, projectId, labels, allLabels, canManage }: Props) {
  const assigned = new Set(labels.map((l) => l.id));

  return (
    <div className="space-y-3">
      {allLabels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allLabels.map((l) => (
            <form key={l.id} action={toggleTaskLabel}>
              <input type="hidden" name="taskId" value={taskId} />
              <input type="hidden" name="labelId" value={l.id} />
              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  assigned.has(l.id)
                    ? "text-white"
                    : "border border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500"
                }`}
                style={assigned.has(l.id) ? { backgroundColor: l.color } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: assigned.has(l.id) ? "rgba(255,255,255,0.8)" : l.color }}
                />
                {l.name}
              </button>
            </form>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">No hay etiquetas en este proyecto.</p>
      )}

      {canManage ? (
        <form action={createLabel} className="flex items-center gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <Input name="name" placeholder="Nueva etiqueta…" className="flex-1" maxLength={40} />
          <Button type="submit" size="sm">
            Crear
          </Button>
        </form>
      ) : null}
    </div>
  );
}