"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProjectMember, removeProjectMember, updateProjectMemberRole } from "@/actions/project";
import { inviteMemberAction, type InvitationActionState } from "@/actions/invitation";
import Avatar from "@/components/atoms/Avatar";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { useToast } from "@/components/providers/ToastProvider";
import type { ProjectRole } from "@/generated/prisma/client";

export interface MemberItem {
  id: string;
  userId: string;
  role: ProjectRole;
  user: { id: string; name: string; email: string; image: string | null };
}

interface Props {
  projectId: string;
  ownerId: string;
  members: MemberItem[];
  availableUsers: { id: string; name: string }[];
}

const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = {
  ADMIN: "Admin",
  MEMBER: "Miembro",
  VIEWER: "Solo lectura",
};

export default function MemberManager({ projectId, ownerId, members, availableUsers }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [inviteState, inviteAction, invitePending] = useActionState(inviteMemberAction, {
    error: null,
    message: null,
    inviteUrl: null,
  } as InvitationActionState);

  const onRoleChange = (member: MemberItem, role: string) => {
    startTransition(async () => {
      const res = await updateProjectMemberRole(projectId, member.userId, role as ProjectRole);
      if (res?.error) {
        toast(res.error, "error");
      } else {
        toast("Rol actualizado", "success");
      }
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="font-medium text-gray-900 dark:text-gray-100">Miembros</h2>
      <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
        {members.map((m) => {
          const isOwner = m.userId === ownerId;
          return (
            <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={m.user.name} src={m.user.image} size="sm" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">{m.user.name}</span>
                    {isOwner ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        Dueño
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-gray-400 dark:text-gray-500">{m.user.email}</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Select
                  value={m.role}
                  disabled={isOwner || pending}
                  aria-label={`Rol de ${m.user.name}`}
                  className="w-auto"
                  onChange={(e) => onRoleChange(m, e.target.value)}
                >
                  {(Object.keys(PROJECT_ROLE_LABEL) as ProjectRole[]).map((r) => (
                    <option key={r} value={r}>
                      {PROJECT_ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>
                {!isOwner ? (
                  <ConfirmDialog
                    action={removeProjectMember.bind(null, projectId, m.userId)}
                    title="Quitar miembro"
                    message={`¿Quitar a ${m.user.name} del proyecto?`}
                    confirmLabel="Quitar"
                    triggerVariant="ghost"
                  >
                    Quitar
                  </ConfirmDialog>
                ) : null}
              </span>
            </li>
          );
        })}
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

      <form action={inviteAction} className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label htmlFor="inviteEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Invitar por correo
            </label>
            <Input
              id="inviteEmail"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nombre@correo.com"
            />
          </div>
          <Button type="submit" size="sm" disabled={invitePending}>
            {invitePending ? "Invitando…" : "Invitar"}
          </Button>
        </div>
        {inviteState?.error ? <p className="mt-2 text-sm text-red-600">{inviteState.error}</p> : null}
        {inviteState?.message ? (
          <p className="mt-2 text-sm text-green-700">{inviteState.message}</p>
        ) : null}
      </form>
    </div>
  );
}