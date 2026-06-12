// Comments: confirmed subscribers write, everyone subscribed reads,
// admin moderates.

import type { Comment } from "@/types";
import { getConfig } from "@/lib/config";
import { notFound, validationError } from "@/lib/errors";
import {
  generateUsername,
  validateChosenUsername,
} from "@/lib/domain/username";
import * as commentsRepo from "@/lib/repositories/comments.repo";
import * as postsRepo from "@/lib/repositories/posts.repo";
import * as subscribersRepo from "@/lib/repositories/subscribers.repo";

export async function listComments(postId: string): Promise<Comment[]> {
  const { db } = await getConfig();
  return commentsRepo.listByPost(db, postId);
}

/**
 * Add a comment as a subscriber. Username resolution, in order:
 * 1. a name chosen on this comment (validated, then remembered),
 * 2. the name remembered from before,
 * 3. a fresh random one from the word bank (then remembered).
 */
export async function addComment(
  subscriberId: string,
  postId: string,
  body: string,
  chosenUsername?: string,
): Promise<Comment> {
  const { db } = await getConfig();

  const post = await postsRepo.getById(db, postId, null);
  if (!post || post.published !== 1) throw notFound("Post not found");

  const subscriber = await subscribersRepo.getById(db, subscriberId);
  if (!subscriber) throw notFound("Subscriber not found");

  let username = subscriber.username;
  if (chosenUsername?.trim()) {
    const result = validateChosenUsername(chosenUsername);
    if (!result.ok) throw validationError(result.reason);
    username = result.username;
  }
  if (!username) username = generateUsername();
  if (username !== subscriber.username) {
    await subscribersRepo.updateUsername(db, subscriberId, username);
  }

  return commentsRepo.create(db, {
    postId,
    subscriberId,
    username,
    body: body.trim(),
  });
}

export async function adminListComments(): Promise<Comment[]> {
  const { db } = await getConfig();
  return commentsRepo.listAll(db);
}

export async function adminDeleteComment(id: string): Promise<void> {
  const { db } = await getConfig();
  const deleted = await commentsRepo.remove(db, id);
  if (!deleted) throw notFound("Comment not found");
}
