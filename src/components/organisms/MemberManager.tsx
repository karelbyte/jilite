"use client";

import { addProjectMember, removeProjectMember } from "@/actions/project";
import Avatar from "@/components/atoms/Avatar";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

export interface MemberItem {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; image: string | null };
}

interface Props {
  projectId: string;
  members: MemberItem[];
  availableUsers: { id: string; name: string }[];
}

export default function MemberManager({ projectId, members, availableUsers }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="font-medium text-gray-900 dark:text-gray-100">Miembros</h2>
      <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between py-2">
            <span className="flex items-center gap-3">
              <Avatar name={m.user.name} src={m.user.image} size="sm" />
              <span>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{m.user.name}</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500">{m.user.email}</span>
              </span>
            </span>
            <ConfirmDialog
              action={removeProjectMember.bind(null, projectId, m.userId)}
              title="Quitar miembro"
              message={`¿Quitar a ${m.user.name} del proyecto?`}
              confirmLabel="Quitar"
              triggerVariant="ghost"
            >
              Quitar
            </ConfirmDialog>
          </li>
        ))}
      </ul>

      {availableUsers.length > 0 ? (
        <form action={addProjectMember.bind(null, projectId)} className="mt-4 flex items-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <div className="flex-1 space-y-1">
            <label htmlFor="newMember" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Agregar miembro
            </label>
            <Select id="newMember" name="userId" defaultValue="">
              <option value="" disabled>
                Selecciona un usuario activo
              </option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" size="sm">
            Agregar
          </Button>
        </form>
      ) : (
        <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-400 dark:border-gray-800 dark:text-gray-500">
          No hay más usuarios activos para agregar.
        </p>
      )}
    </div>
  );
}