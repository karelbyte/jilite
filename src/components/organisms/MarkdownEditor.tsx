"use client";

import { useRef, useState } from "react";
import { useId } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import Textarea from "@/components/atoms/Textarea";

interface Tool {
  label: string;
  title: string;
  apply: (before: string, selection: string, after: string) => { before: string; middle: string; after: string };
}

const TOOLS: Tool[] = [
  {
    label: "B",
    title: "Negrita",
    apply: (b, sel, a) => ({ before: b, middle: `**${sel || "texto**"}`, after: a }),
  },
  {
    label: "I",
    title: "Cursiva",
    apply: (b, sel, a) => ({ before: b, middle: `*${sel || "texto*"}`, after: a }),
  },
  {
    label: "H2",
    title: "Subtítulo",
    apply: (b, sel, a) => ({ before: b, middle: `## ${sel || "Título"}`, after: a }),
  },
  {
    label: "•",
    title: "Lista",
    apply: (b, sel, a) => ({
      before: b,
      middle: `\n- ${sel || "elemento"}`,
      after: a,
    }),
  },
  {
    label: "1.",
    title: "Lista numerada",
    apply: (b, sel, a) => ({
      before: b,
      middle: `\n1. ${sel || "elemento"}`,
      after: a,
    }),
  },
  {
    label: "🔗",
    title: "Enlace",
    apply: (b, sel, a) => ({
      before: b,
      middle: `[${sel || "texto del enlace"}](https://)`,
      after: a,
    }),
  },
  {
    label: "`",
    title: "Código",
    apply: (b, sel, a) => ({ before: b, middle: `\`${sel || "código"}\``, after: a }),
  },
  {
    label: ">",
    title: "Cita",
    apply: (b, sel, a) => ({ before: b, middle: `> ${sel || "cita"}`, after: a }),
  },
];

interface Props {
  id?: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  preview?: boolean;
}

export default function MarkdownEditor({
  id,
  name,
  defaultValue = "",
  rows = 5,
  maxLength = 5000,
  placeholder,
  preview = true,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const ref = useRef<HTMLTextAreaElement>(null);
  const autoId = useId();
  const textareaId = id ?? autoId;

  const applyTool = (tool: Tool) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selection = value.slice(start, end);
    const { before, middle, after } = tool.apply(value.slice(0, start), selection, value.slice(end));
    const next = before + middle + after;
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const newPos = (before + middle).length;
      el.setSelectionRange(newPos, newPos);
    });
  };

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1.5 dark:border-gray-700">
      {TOOLS.map((t) => (
        <button
          key={t.title}
          type="button"
          title={t.title}
          onClick={() => applyTool(t)}
          className="flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t.label}
        </button>
      ))}
      <span className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
      {preview ? (
        <button
          type="button"
          onClick={() => setMode(mode === "write" ? "preview" : "write")}
          className="ml-auto rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
        >
          {mode === "write" ? "Vista previa" : "Escribir"}
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
      {toolbar}
      {mode === "write" ? (
        <div className="p-2">
          <Textarea
            id={textareaId}
            ref={ref}
            name={name}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={rows}
            maxLength={maxLength}
            placeholder={placeholder}
            className="border-0 ring-0 focus:ring-0 dark:bg-gray-900"
          />
        </div>
      ) : (
        <div className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
          {value.trim() ? (
            <MarkdownView source={value} />
          ) : (
            <p className="text-gray-400 dark:text-gray-500">Nada para previsualizar.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function MarkdownView({ source }: { source: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-brand-700 prose-pre:rounded-md prose-pre:bg-gray-900 prose-pre:text-gray-100 dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
