"use client";

// Lazy-loading + posting comments for one post.

import { useCallback, useState } from "react";
import type { Comment } from "@/types";
import { apiFetch, ApiError } from "@/hooks/use-api";

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ comments: Comment[] }>(
        `/api/comments?postId=${postId}`,
      );
      setComments(data.comments);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load comments");
    }
  }, [postId]);

  const add = useCallback(
    async (body: string, username?: string) => {
      setPosting(true);
      setError(null);
      try {
        const data = await apiFetch<{ comment: Comment }>("/api/comments", {
          method: "POST",
          body: JSON.stringify({ postId, body, username: username || undefined }),
        });
        setComments((prev) => [...(prev ?? []), data.comment]);
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't post comment");
        return false;
      } finally {
        setPosting(false);
      }
    },
    [postId],
  );

  return { comments, error, posting, load, add };
}
