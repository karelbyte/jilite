import type { Comment } from "@/generated/prisma/client";
import CommentItem from "@/components/molecules/CommentItem";
import EmptyState from "@/components/molecules/EmptyState";

interface Props {
  comments: Array<
    Pick<Comment, "id" | "body" | "createdAt"> & {
      author: { name: string; image: string | null };
    }
  >;
}

export default function CommentList({ comments }: Props) {
  if (comments.length === 0) {
    return (
      <EmptyState
        title="Sin comentarios"
        description="Sé el primero en comentar esta tarea."
      />
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}