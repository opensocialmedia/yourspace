"use client";

// Existing posts: edit body inline, toggle published, delete.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/types";
import { apiFetch, ApiError } from "@/hooks/use-api";
import { formatTimeAgo } from "@/components/format";

export function AdminPostList({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function mutate(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  if (posts.length === 0) {
    return <p className="text-muted text-[14px]">No posts yet — write the first one above.</p>;
  }

  return (
    <div className="space-y-3">
      <h2 className="font-bold">All posts ({posts.length})</h2>
      {error && <p className="text-[14px] text-red-400">{error}</p>}

      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-2xl border border-border-soft p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <span className="rounded-full border border-border-soft px-2 py-0.5 uppercase">
              {post.type}
            </span>
            <span>{formatTimeAgo(post.createdAt)}</span>
            <span>
              👍 {post.likeCount} · 👎 {post.dislikeCount} · 💬 {post.commentCount}
            </span>
            {!post.published && (
              <span className="text-yellow-500 font-bold">hidden</span>
            )}
          </div>

          {editingId === post.id ? (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full rounded-xl border border-border-soft bg-background px-3 py-2 text-[14px] outline-none focus:border-accent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    mutate(async () => {
                      await apiFetch(`/api/admin/posts/${post.id}`, {
                        method: "PUT",
                        body: JSON.stringify({ body: draft }),
                      });
                      setEditingId(null);
                    })
                  }
                  className="rounded-full bg-accent px-4 py-1.5 text-[13px] font-bold text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-full border border-border-soft px-4 py-1.5 text-[13px] text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[14px] whitespace-pre-wrap">
              {post.body || (
                <span className="text-muted italic">
                  {post.linkUrl ?? "(no text)"}
                </span>
              )}
            </p>
          )}

          <div className="flex gap-3 text-[13px]">
            <button
              onClick={() => {
                setEditingId(post.id);
                setDraft(post.body);
              }}
              className="text-accent hover:underline"
            >
              Edit
            </button>
            <button
              onClick={() =>
                mutate(() =>
                  apiFetch(`/api/admin/posts/${post.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ published: !post.published }),
                  }),
                )
              }
              className="text-muted hover:underline"
            >
              {post.published ? "Hide" : "Publish"}
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this post and its comments forever?")) {
                  mutate(() =>
                    apiFetch(`/api/admin/posts/${post.id}`, { method: "DELETE" }),
                  );
                }
              }}
              className="text-red-400 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
