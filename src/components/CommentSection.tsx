"use client";

// Collapsible comment list + composer under a post. Comments load only
// when opened. Commenters get a random word-bank username unless they
// type their own.

import { useState } from "react";
import { useComments } from "@/hooks/use-comments";
import { formatTimeAgo } from "@/components/format";
import { MAX_COMMENT_LENGTH, MAX_USERNAME_LENGTH } from "@/lib/constants";

export function CommentSection({
  postId,
  open,
}: {
  postId: string;
  open: boolean;
}) {
  const { comments, error, posting, load, add } = useComments(postId);
  const [body, setBody] = useState("");
  const [username, setUsername] = useState("");
  const [loadedOnce, setLoadedOnce] = useState(false);

  if (open && !loadedOnce) {
    setLoadedOnce(true);
    void load();
  }

  if (!open) return null;

  return (
    <div className="mt-3 border-t border-border-soft pt-3">
      {comments === null && !error && (
        <p className="text-muted text-[14px]">Loading comments…</p>
      )}
      {error && <p className="text-red-400 text-[14px]">{error}</p>}

      {comments?.length === 0 && (
        <p className="text-muted text-[14px]">No comments yet. Be first.</p>
      )}

      <ul className="space-y-3">
        {comments?.map((comment) => (
          <li key={comment.id} className="text-[14px]">
            <span className="font-bold">{comment.username}</span>{" "}
            <span className="text-muted">
              · {formatTimeAgo(comment.createdAt)}
            </span>
            <p className="mt-0.5 whitespace-pre-wrap">{comment.body}</p>
          </li>
        ))}
      </ul>

      <form
        className="mt-4 space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await add(body, username)) setBody("");
        }}
      >
        <textarea
          required
          maxLength={MAX_COMMENT_LENGTH}
          rows={2}
          placeholder="Leave a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-xl border border-border-soft bg-background p-3 text-[14px] outline-none focus:border-accent resize-none"
        />
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={MAX_USERNAME_LENGTH}
            placeholder="Username (optional — we'll invent one)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 rounded-full border border-border-soft bg-background px-4 py-2 text-[13px] outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={posting || !body.trim()}
            className="rounded-full bg-accent px-5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
          >
            {posting ? "Posting…" : "Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
