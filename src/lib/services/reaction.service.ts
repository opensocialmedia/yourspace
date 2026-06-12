// Like/dislike toggling for subscribers.

import { getConfig } from "@/lib/config";
import { notFound } from "@/lib/errors";
import * as reactionsRepo from "@/lib/repositories/reactions.repo";
import * as postsRepo from "@/lib/repositories/posts.repo";

export interface ReactionResult {
  likes: number;
  dislikes: number;
  viewerReaction: "like" | "dislike" | null;
}

export async function react(
  subscriberId: string,
  postId: string,
  kind: "like" | "dislike",
): Promise<ReactionResult> {
  const { db } = await getConfig();

  const post = await postsRepo.getById(db, postId, null);
  if (!post || post.published !== 1) throw notFound("Post not found");

  const outcome = await reactionsRepo.setReaction(db, postId, subscriberId, kind);
  const counts = await reactionsRepo.getCounts(db, postId);
  return {
    likes: counts.likes,
    dislikes: counts.dislikes,
    viewerReaction: outcome === "removed" ? null : kind,
  };
}
