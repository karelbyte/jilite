import Link from "next/link";
import { verifyEmailAction } from "@/actions/auth";
import AuthTemplate from "@/templates/Auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { ok: false, message: "Falta el código de verificación." };

  return (
    <AuthTemplate title="Verificación de correo" subtitle="Confirma tu cuenta en Jilite">
      <div
        className={`mb-4 rounded-lg border p-4 text-sm ${
          result.ok
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-700"
        }`}
      >
        {result.message}
      </div>
      {result.ok ? (
        <Link
          href="/login"
          className="block w-full rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          Iniciar sesión
        </Link>
      ) : (
        <Link
          href="/register"
          className="block w-full rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          Registrarme de nuevo
        </Link>
      )}
    </AuthTemplate>
  );
}
