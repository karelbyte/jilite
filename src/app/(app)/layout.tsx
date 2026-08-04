import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Header from "@/components/organisms/Header";
import CommandPalette from "@/components/organisms/CommandPalette";
import { ToastProvider } from "@/components/providers/ToastProvider";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Header
          user={{
            name: user.name,
            email: user.email,
            image: user.image,
          }}
          role={user.role}
          unreadCount={unreadCount}
        />
        {children}
      </div>
      <CommandPalette />
    </ToastProvider>
  );
}