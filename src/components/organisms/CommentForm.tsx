"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createComment } from "@/actions/comment";
import Button from "@/components/atoms/Button";
import Textarea from "@/components/atoms/Textarea";
import Modal from "@/components/molecules/Modal";
import { useToast } from "@/components/providers/ToastProvider";

interface Props {
  taskId: string;
  members: { id: string; name: string }[];
}

interface MentionState {
  at: number;
  cursor: number;
  query: string;
  index: number;
}

function computeMention(text: string, cursor: number): MentionState | null {
  const before = text.slice(0, cursor);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;
  const token = before.slice(at);
  if (token.includes("\n")) return null;
  return { at, cursor, query: token.slice(1), index: 0 };
}

export default function CommentForm({ taskId, members }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [mention, setMention] = useState<MentionState | null>(null);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filtered = mention
    ? members.filter((m) => m.name.toLowerCase().includes(mention.query.toLowerCase()))
    : [];

  function selectMention(member: { id: string; name: string }) {
    if (!mention) return;
    const next =
      value.slice(0, mention.at) + `@${member.name} ` + value.slice(mention.cursor);
    setValue(next);
    setMention(null);
    const pos = mention.at + member.name.length + 2;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createComment({ error: null }, fd);
      if (res?.error) {
        toast(res.error, "error");
        return;
      }
      setOpen(false);
      setValue("");
      setMention(null);
      router.refresh();
    });
  };

  return (
    <div>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Comentar
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo comentario">
        <form onSubmit={onSubmit} className="space-y-3">
          <input type="hidden" name="taskId" value={taskId} />
          <div className="relative">
            <Textarea
              ref={textareaRef}
              name="body"
              rows={4}
              maxLength={3000}
              required
              placeholder="Escribe un comentario… (usa @ para mencionar)"
              value={value}
              onChange={(e) => {
                const text = e.target.value;
                setValue(text);
                setMention(computeMention(text, e.target.selectionStart ?? text.length));
              }}
              onKeyDown={(e) => {
                if (!mention || filtered.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMention({ ...mention, index: (mention.index + 1) % filtered.length });
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMention({
                    ...mention,
                    index: (mention.index - 1 + filtered.length) % filtered.length,
                  });
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setMention(null);
                } else if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  selectMention(filtered[mention.index]);
                }
              }}
              onBlur={() => setTimeout(() => setMention(null), 120)}
            />
            {mention && filtered.length > 0 ? (
              <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {filtered.map((member, i) => (
                  <button
                    key={member.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectMention(member)}
                    className={`block w-full px-3 py-1.5 text-left text-sm ${
                      i === mention.index
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="font-medium">{member.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Enviando…" : "Publicar comentario"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
