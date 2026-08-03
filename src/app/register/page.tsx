import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import RegisterForm from "@/components/organisms/RegisterForm";
import AuthTemplate from "@/templates/Auth";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <AuthTemplate title="Crea tu cuenta" subtitle="Empieza a gestionar tus tareas">
      <RegisterForm />
      <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthTemplate>
  );
}