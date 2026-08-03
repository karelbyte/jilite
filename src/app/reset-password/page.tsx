import Link from "next/link";
import ResetPasswordForm from "@/components/organisms/ResetPasswordForm";
import AuthTemplate from "@/templates/Auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthTemplate title="Enlace inválido" subtitle="No se encontró un código de restablecimiento">
        <p className="text-sm text-red-600">
          El enlace que usaste no es válido. Solicita uno nuevo.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 block w-full rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          Solicitar nuevo enlace
        </Link>
      </AuthTemplate>
    );
  }

  return (
    <AuthTemplate title="Nueva contraseña" subtitle="Elige una nueva clave para tu cuenta">
      <ResetPasswordForm token={token} />
    </AuthTemplate>
  );
}