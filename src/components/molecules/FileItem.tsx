"use client";

import { deleteFile } from "@/actions/comment";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

interface Props {
  file: { id: string; name: string; contentType: string };
}

export default function FileItem({ file }: Props) {
  const isImage = file.contentType.startsWith("image/");

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
      <FileIcon />
      <a
        href={`/api/files/${file.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-sm text-brand-700 hover:underline"
      >
        {isImage ? "Imagen" : file.name}
      </a>
      <ConfirmDialog
        action={deleteFile.bind(null, file.id)}
        title="Eliminar archivo"
        message="¿Seguro que quieres eliminar este archivo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        triggerVariant="ghost"
        confirmVariant="danger"
        size="sm"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="h-4 w-4 text-gray-400 hover:text-red-600"
        >
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ConfirmDialog>
    </li>
  );
}

function FileIcon() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </span>
  );
}