import Link from "next/link";
import Logo from "@/components/atoms/Logo";
import UserMenu from "@/components/molecules/UserMenu";
import ThemeToggle from "@/components/atoms/ThemeToggle";
import type { Role } from "@/generated/prisma/client";

interface Props {
  user: { name: string; email: string; image: string | null };
  role: Role;
}

export default function Header({ user, role }: Props) {
  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo href="/dashboard" />
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-brand-700 dark:text-gray-300 dark:hover:text-brand-400">
              Proyectos
            </Link>
            <Link href="/calendar" className="text-sm font-medium text-gray-600 hover:text-brand-700 dark:text-gray-300 dark:hover:text-brand-400">
              Calendario
            </Link>
            {role === "ADMIN" ? (
              <Link href="/admin/users" className="text-sm font-medium text-gray-600 hover:text-brand-700 dark:text-gray-300 dark:hover:text-brand-400">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu user={user} role={role} />
      </div>
      </div>
    </header>
  );
}