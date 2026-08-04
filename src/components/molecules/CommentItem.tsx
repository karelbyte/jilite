import type { Comment } from "@/generated/prisma/client";
import { timeAgo } from "@/lib/format";
import { mentionRegexFrom } from "@/lib/mentions";
import Avatar from "@/components/atoms/Avatar";

interface Props {
  comment: Pick<Comment, "id" | "body" | "createdAt"> & {
    author: { name: string; image: string | null };
  };
  memberNames: string[];
  projectId: string;
}

function renderBody(body: string, memberNames: string[], projectId: string) {
  const re = mentionRegexFrom(memberNames);
  if (!re) return body;
  const parts = body.split(re);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <a
          key={i}
          href={`/projects/${projectId}?tab=miembros`}
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function CommentItem({ comment, memberNames, projectId }: Props) {
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
        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
          {renderBody(comment.body, memberNames, projectId)}
        </p>
      </div>
    </div>
  );
}
