// Posts: gated feed for visitors, full CRUD for the admin.

import type { Post } from "@/types";
import { getConfig } from "@/lib/config";
import { notFound } from "@/lib/errors";
import { assertPostRules } from "@/lib/domain/posts";
import * as postsRepo from "@/lib/repositories/posts.repo";
import * as mediaRepo from "@/lib/repositories/media.repo";

function toPost(row: postsRepo.PostRow): Post {
  return {
    id: row.id,
    type: row.type,
    body: row.body,
    // Media is streamed through our own gated route, never a raw R2 URL.
    mediaUrl: row.media_key ? `/api/media/${row.media_key}` : null,
    mediaContentType: row.media_content_type,
    linkUrl: row.link_url,
    linkTitle: row.link_title,
    linkDescription: row.link_description,
    linkImageUrl: row.link_image_url,
    published: row.published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likeCount: row.like_count,
    dislikeCount: row.dislike_count,
    commentCount: row.comment_count,
    viewerReaction: (row.viewer_reaction as Post["viewerReaction"]) ?? null,
  };
}

/** The subscriber-visible feed (published posts only). */
export async function getFeed(
  viewerId: string,
  tab: string,
): Promise<Post[]> {
  const { db } = await getConfig();
  const rows = await postsRepo.listPublished(db, viewerId, tab);
  return rows.map(toPost);
}

/** Counts per tab for the gate page (shown without revealing content). */
export async function getPublishedCount(): Promise<number> {
  const { db } = await getConfig();
  const rows = await postsRepo.listPublished(db, null, "all");
  return rows.length;
}

export async function getPost(
  id: string,
  viewerId: string | null,
): Promise<Post> {
  const { db } = await getConfig();
  const row = await postsRepo.getById(db, id, viewerId);
  if (!row || row.published !== 1) throw notFound("Post not found");
  return toPost(row);
}

// ── Admin ────────────────────────────────────────────────────────────

export async function adminListPosts(): Promise<Post[]> {
  const { db } = await getConfig();
  const rows = await postsRepo.listAll(db);
  return rows.map(toPost);
}

export async function adminCreatePost(
  data: postsRepo.CreatePostData,
): Promise<string> {
  assertPostRules({
    type: data.type,
    body: data.body,
    mediaKey: data.mediaKey,
    linkUrl: data.linkUrl,
  });
  const { db } = await getConfig();
  return postsRepo.create(db, data);
}

export async function adminUpdatePost(
  id: string,
  data: postsRepo.UpdatePostData,
): Promise<void> {
  const { db } = await getConfig();
  const updated = await postsRepo.update(db, id, data);
  if (!updated) throw notFound("Post not found");
}

/** Deletes the post and its R2 media object, if it had one. */
export async function adminDeletePost(id: string): Promise<void> {
  const { db, media } = await getConfig();
  const { deleted, mediaKey } = await postsRepo.remove(db, id);
  if (!deleted) throw notFound("Post not found");
  if (mediaKey) await mediaRepo.remove(media, mediaKey);
}
