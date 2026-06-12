"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Comment } from "@/types";
import { apiFetch } from "@/hooks/use-api";
import { formatTimeAgo } from "@/components/format";

export function AdminCommentsTable({ comments }: { comments: Comment[] }) {
  const router = useRouter();

  if (comments.length === 0) {
    return <p className="text-muted text-[14px]">No comments yet.</p>;
  }

  return (
    <div className="space-y-3">
      <h2 className="font-bold">All comments ({comments.length})</h2>
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-2xl border border-border-soft p-4"
        >
          <p className="text-[13px] text-muted">
            <span className="font-bold text-foreground">{comment.username}</span>{" "}
            · {formatTimeAgo(comment.createdAt)} ·{" "}
            <Link
              href={`/post/${comment.postId}`}
              className="text-accent hover:underline"
            >
              view post
            </Link>
          </p>
          <p className="mt-1 text-[14px] whitespace-pre-wrap">{comment.body}</p>
          <button
            onClick={async () => {
              if (confirm("Delete this comment?")) {
                await apiFetch(`/api/admin/comments/${comment.id}`, {
                  method: "DELETE",
                });
                router.refresh();
              }
            }}
            className="mt-2 text-[13px] text-red-400 hover:underline"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
