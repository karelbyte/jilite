import Link from "next/link";
import Button from "@/components/atoms/Button";
import NewUserModal from "@/components/organisms/NewUserModal";
import AdminBulkTable from "@/components/organisms/AdminBulkTable";
import Pagination from "@/components/molecules/Pagination";
import { ROLES, ROLE_META } from "@/lib/constants";
import type { Role, UserStatus } from "@/generated/prisma/client";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string | Date;
  _count?: { tasks: number };
}

interface Props {
  users: AdminUserItem[];
  currentUserId: string;
  page: number;
  totalPages: number;
  query: string;
  role: string | null;
  status: string | null;
}

export default function AdminUsersTemplate({
  users,
  currentUserId,
  page,
  totalPages,
  query,
  role,
  status,
}: Props) {
  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Administración de usuarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Crea usuarios, cambia roles y activa o desactiva cuentas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/activity" className="text-sm font-medium text-brand-700 hover:underline">
            Ver actividad
          </Link>
          <NewUserModal />
        </div>
      </div>

      <form method="GET" action="/admin/users" className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-52">
          <label htmlFor="q" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            Buscar por nombre
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="Ej. María"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            Rol
          </label>
          <select
            id="role"
            name="role"
            defaultValue={role ?? ""}
            className="mt-1 w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Todos</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
        <Button type="submit" size="sm">
          Buscar
        </Button>
        {query || role || status ? (
          <Link href="/admin/users" className="text-sm font-medium text-brand-700 hover:underline">
            Limpiar filtros
          </Link>
        ) : null}
      </form>

      <AdminBulkTable users={users} currentUserId={currentUserId} query={query} />

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Los usuarios se activan solos al confirmar su correo. Si no, puedes activarlos aquí.{" "}
        <Link href="/dashboard" className="font-medium text-brand-700 hover:underline">
          Ir a proyectos
        </Link>
      </p>

      <Pagination page={page} totalPages={totalPages} />
    </main>
  );
}