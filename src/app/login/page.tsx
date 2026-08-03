import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import LoginForm from "@/components/organisms/LoginForm";
import AuthTemplate from "@/templates/Auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <AuthTemplate title="Iniciar sesión" subtitle="Accede a tu cuenta">
      <LoginForm />
      <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthTemplate>
  );
}