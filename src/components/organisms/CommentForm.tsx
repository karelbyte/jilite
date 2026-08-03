"use client";

import { useActionState } from "react";
import { createComment } from "@/actions/comment";
import Button from "@/components/atoms/Button";
import Textarea from "@/components/atoms/Textarea";

interface Props {
  taskId: string;
}

export default function CommentForm({ taskId }: Props) {
  const [state, formAction, pending] = useActionState(createComment, { error: null });

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      <Textarea name="body" rows={3} maxLength={3000} required placeholder="Escribe un comentario…" />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Comentar"}
        </Button>
      </div>
    </form>
  );
}