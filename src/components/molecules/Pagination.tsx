"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Props {
  page: number;
  totalPages: number;
}

export default function Pagination({ page, totalPages }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    return `${pathname}?${sp.toString()}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  const item =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium";

  return (
    <nav className="flex items-center justify-center gap-1 pt-6" aria-label="Paginación">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${item} border-gray-300 text-gray-600 hover:bg-gray-50`}>
          ‹
        </Link>
      ) : null}
      {start > 1 ? <span className={`${item} border-transparent text-gray-400`}>…</span> : null}
      {pages.map((p) =>
        p === page ? (
          <span key={p} className={`${item} border-brand-600 bg-brand-600 text-white`}>
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p)} className={`${item} border-gray-300 text-gray-600 hover:bg-gray-50`}>
            {p}
          </Link>
        )
      )}
      {end < totalPages ? <span className={`${item} border-transparent text-gray-400`}>…</span> : null}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={`${item} border-gray-300 text-gray-600 hover:bg-gray-50`}>
          ›
        </Link>
      ) : null}
    </nav>
  );
}