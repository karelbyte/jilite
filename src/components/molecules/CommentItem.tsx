import type { Comment } from "@/generated/prisma/client";
import { timeAgo } from "@/lib/format";
import Avatar from "@/components/atoms/Avatar";

interface Props {
  comment: Pick<Comment, "id" | "body" | "createdAt"> & {
    author: { name: string; image: string | null };
  };
}

export default function CommentItem({ comment }: Props) {
  return (
    <div className="flex gap-3">
      <Avatar name={comment.author.name} src={comment.author.image} size="sm" />
      <div className="flex-1 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {comment.author.name}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{comment.body}</p>
      </div>
    </div>
  );
}