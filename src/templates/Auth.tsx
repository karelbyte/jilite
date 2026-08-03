import Logo from "@/components/atoms/Logo";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthTemplate({ title, subtitle, children }: Props) {
  return (
    <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-gray-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}