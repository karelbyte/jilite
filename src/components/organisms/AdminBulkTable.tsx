"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { adminBulkSetStatus } from "@/actions/admin";
import Badge from "@/components/atoms/Badge";
import Avatar from "@/components/atoms/Avatar";
import Button from "@/components/atoms/Button";
import AdminUserControls from "@/components/organisms/AdminUserControls";
import { ROLE_META, USER_STATUS_META } from "@/lib/constants";
import type { AdminUserItem } from "@/templates/AdminUsers";

interface Props {
  users: AdminUserItem[];
  currentUserId: string;
  query: string;
}

export default function AdminBulkTable({ users, currentUserId, query }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, bulkAction, bulkPending] = useActionState(adminBulkSetStatus, {
    error: null,
    message: null,
  });

  const allSelected = users.length > 0 && users.every((u) => selected.includes(u.id));
  const pageIds = users.map((u) => u.id);

  function toggleAll() {
    setSelected((prev) =>
      allSelected ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))
    );
  }
  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div>
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <span className="text-sm text-gray-600 dark:text-gray-300">{selected.length} seleccionado(s)</span>
          <div className="flex flex-wrap items-center gap-2">
            {selected.length > 0 ? (
              <form action={bulkAction} className="flex items-center gap-2">
                {selected.map((id) => (
                  <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <input type="hidden" name="status" value="ACTIVE" />
                <Button type="submit" size="sm" disabled={bulkPending}>
                  Activar
                </Button>
              </form>
            ) : null}
            {selected.length > 0 ? (
              <form action={bulkAction} className="flex items-center gap-2">
                {selected.map((id) => (
                  <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <input type="hidden" name="status" value="INACTIVE" />
                <Button type="submit" variant="secondary" size="sm" disabled={bulkPending}>
                  Desactivar
                </Button>
              </form>
            ) : null}
            <Link href="/admin/users/export">
              <Button type="button" variant="secondary" size="sm">
                Exportar CSV
              </Button>
            </Link>
          </div>
        </div>
        {bulkStatus?.error ? (
          <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">{bulkStatus.error}</p>
        ) : null}

        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-400 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Tareas</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  No se encontraron usuarios{query ? ` para “${query}”` : ""}. Ajusta los filtros o crea uno nuevo.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const role = ROLE_META[u.role];
                const status = USER_STATUS_META[u.status];
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${u.name}`}
                        checked={selected.includes(u.id)}
                        onChange={() => toggle(u.id)}
className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.image} size="sm" />
                        <span>
                          <span className="block font-medium text-gray-900 dark:text-gray-100">
                            {u.name}
                            {u.id === currentUserId ? (
                              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">(tú)</span>
                            ) : null}
                          </span>
                          <span className="block text-xs text-gray-400 dark:text-gray-500">{u.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={role.className}>{role.label}</Badge>
                    </td>
                    <td className="px-4 py-3">{u._count?.tasks ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge className={status.className}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.id === currentUserId ? (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Sin acciones</span>
                      ) : (
                        <AdminUserControls
                          userId={u.id}
                          role={u.role}
                          status={u.status}
                          taskCount={u._count?.tasks ?? 0}
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}