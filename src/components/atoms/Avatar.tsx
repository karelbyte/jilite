interface Props {
  name: string;
  src?: string | null;
  size?: "sm" | "md";
}

const sizes = {
  sm: "h-6 w-6 text-xs",
  md: "h-9 w-9 text-sm",
};

export default function Avatar({ name, src, size = "md" }: Props) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${sizes[size]} inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700`}
      title={name}
    >
      {initials}
    </span>
  );
}