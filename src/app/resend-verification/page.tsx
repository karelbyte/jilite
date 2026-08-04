import Link from "next/link";
import ResendVerificationForm from "@/components/organisms/ResendVerificationForm";
import AuthTemplate from "@/templates/Auth";

export default function ResendVerificationPage() {
  return (
    <AuthTemplate title="Reenviar correo de verificación" subtitle="Te enviaremos un nuevo enlace para confirmar tu cuenta">
      <ResendVerificationForm />
      <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthTemplate>
  );
}
