import Link from "next/link";
import Logo from "@/components/atoms/Logo";
import UserMenu from "@/components/molecules/UserMenu";
import type { Role } from "@/generated/prisma/client";

interface Props {
  user: { name: string; email: string; image: string | null };
  role: Role;
}

export default function Header({ user, role }: Props) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo href="/dashboard" />
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-brand-700">
              Proyectos
            </Link>
            {role === "ADMIN" ? (
              <Link href="/admin/users" className="text-sm font-medium text-gray-600 hover:text-brand-700">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>
        <UserMenu user={user} role={role} />
      </div>
    </header>
  );
}