import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AcceptInviteForm from "@/components/organisms/AcceptInviteForm";
import AuthTemplate from "@/templates/Auth";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) notFound();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { project: { select: { name: true } } },
  });

  if (!invitation) {
    return (
      <AuthTemplate title="Invitación" subtitle="Invitación no válida">
        <p className="text-sm text-red-600">El enlace de invitación no es válido o ya fue utilizado.</p>
      </AuthTemplate>
    );
  }

  if (invitation.accepted) {
    return (
      <AuthTemplate title="Invitación" subtitle="Invitación ya usada">
        <p className="text-sm text-gray-600 dark:text-gray-300">Esta invitación ya fue aceptada.</p>
      </AuthTemplate>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <AuthTemplate title="Invitación" subtitle="Invitación expirada">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Esta invitación expiró. Contactá al administrador para que te envíe una nueva.
        </p>
      </AuthTemplate>
    );
  }

  const session = await auth();

  return (
    <AuthTemplate
      title={`Invitación a "${invitation.project.name}"`}
      subtitle={`Te invitan a unirte a este proyecto en Jilite`}
    >
      {session?.user ? (
        <AcceptInviteForm token={invitation.token} projectName={invitation.project.name} />
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Para aceptar esta invitación, necesitás iniciar sesión con <strong>{invitation.email}</strong>.
          </p>
          <a
            href={`/register?invite=${encodeURIComponent(invitation.token)}`}
            className="mt-4 block w-full rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
          >
            Crear cuenta / Iniciar sesión
          </a>
          <a
            href="/login"
            className="mt-3 block w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-brand-700 hover:bg-gray-50 dark:border-gray-700 dark:text-brand-300"
          >
            Iniciar sesión
          </a>
        </>
      )}
    </AuthTemplate>
  );
}
