import Link from "next/link";
import { formatDate } from "@/lib/format";

export interface ProjectFile {
  id: string;
  name: string;
  contentType: string;
  createdAt: string | Date;
  task: { id: string; title: string };
  uploadedBy: { name: string };
}

export default function ProjectFiles({ files }: { files: ProjectFile[] }) {
  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Este proyecto todavía no tiene archivos.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex flex-wrap items-center gap-3 px-4 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>

            <div className="min-w-0 flex-1">
              <a
                href={`/api/files/${file.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-sm font-medium text-gray-900 hover:text-brand-700 dark:text-gray-100 dark:hover:text-brand-300"
                title={file.name}
              >
                {file.name}
              </a>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {file.contentType} · {file.uploadedBy.name} · {formatDate(file.createdAt)}
              </p>
            </div>

            <Link
              href={`/tasks/${file.task.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-brand-300 dark:hover:bg-gray-700"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path
                  d="M9 6a6 6 0 1 1 3 11.2A6 6 0 0 1 9 6Zm3 6 4-4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              {file.task.title}
            </Link>

            <a
              href={`/api/files/${file.id}`}
              download
              aria-label={`Descargar ${file.name}`}
              title="Descargar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand-700 dark:hover:bg-gray-800 dark:hover:text-brand-300"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
