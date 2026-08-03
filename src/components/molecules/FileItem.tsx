"use client";

import { useState } from "react";
import { deleteFile } from "@/actions/comment";
import Button from "@/components/atoms/Button";

interface Props {
  file: { id: string; name: string; contentType: string };
}

export default function FileItem({ file }: Props) {
  const [pending, setPending] = useState(false);
  const isImage = file.contentType.startsWith("image/");

  const onDelete = async () => {
    setPending(true);
    await deleteFile(file.id);
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <FileIcon />
      <a
        href={`/api/files/${file.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-sm text-brand-700 hover:underline"
      >
        {isImage ? "Imagen" : file.name}
      </a>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={pending}
        className="text-red-600 hover:bg-red-50"
      >
        Eliminar
      </Button>
    </li>
  );
}

function FileIcon() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700">
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