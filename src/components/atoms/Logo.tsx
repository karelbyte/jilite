import Link from "next/link";

interface Props {
  href?: string;
  className?: string;
}

export default function Logo({ href, className = "" }: Props) {
  const content = (
    <span className={`inline-flex items-center gap-2 font-semibold ${className}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M12 3C9 3 5 6 5 10c0 4 3 7 7 11 4-4 7-7 7-11 0-4-4-7-7-7Z"
            fill="currentColor"
          />
          <path d="M12 7v6M9 9h6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-lg text-gray-900 dark:text-gray-100">Jilite</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Jilite">
        {content}
      </Link>
    );
  }

  return content;
}