"use client";

// Like/dislike state for one post, kept in sync with the server's counts.

import { useState } from "react";
import { apiFetch } from "@/hooks/use-api";

interface ReactionState {
  likes: number;
  dislikes: number;
  viewerReaction: "like" | "dislike" | null;
}

export function useReactions(postId: string, initial: ReactionState) {
  const [state, setState] = useState<ReactionState>(initial);
  const [busy, setBusy] = useState(false);

  async function react(kind: "like" | "dislike") {
    if (busy) return;
    setBusy(true);
    try {
      const result = await apiFetch<ReactionState>("/api/reactions", {
        method: "PUT",
        body: JSON.stringify({ postId, kind }),
      });
      setState(result);
    } catch {
      // Leave the previous counts; a failed toggle isn't worth an alert.
    } finally {
      setBusy(false);
    }
  }

  return { ...state, react, busy };
}
