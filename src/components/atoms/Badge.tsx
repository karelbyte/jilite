interface Props {
  className?: string;
  children: React.ReactNode;
}

export default function Badge({ className = "", children }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}