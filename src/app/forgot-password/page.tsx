import Link from "next/link";
import ForgotPasswordForm from "@/components/organisms/ForgotPasswordForm";
import AuthTemplate from "@/templates/Auth";

export default function ForgotPasswordPage() {
  return (
    <AuthTemplate title="Recuperar contraseña" subtitle="Te enviaremos un enlace para restablecerla">
      <ForgotPasswordForm />
      <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthTemplate>
  );
}