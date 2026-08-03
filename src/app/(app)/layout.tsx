import { requireUser } from "@/lib/rbac";
import Header from "@/components/organisms/Header";
import { ToastProvider } from "@/components/providers/ToastProvider";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

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
        />
        {children}
      </div>
    </ToastProvider>
  );
}