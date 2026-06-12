// All D1 access for posts. Every query is parameterized — string
// concatenation into SQL is never allowed in this file.

import type { PostType } from "@/types";
import { randomId } from "@/lib/crypto";

/** Raw DB row, including aggregate counts joined in. */
export interface PostRow {
  id: string;
  type: PostType;
  body: string;
  media_key: string | null;
  media_content_type: string | null;
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  link_image_url: string | null;
  published: number;
  created_at: string;
  updated_at: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  viewer_reaction: string | null;
}

const POST_SELECT = `
  SELECT p.*,
    (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'like') AS like_count,
    (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'dislike') AS dislike_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
    (SELECT kind FROM reactions r WHERE r.post_id = p.id AND r.subscriber_id = ?1) AS viewer_reaction
  FROM posts p
`;

// The feed tabs map to post types: photos → image, videos → video,
// media → link. "all" applies no type filter.
const TAB_TYPE: Record<string, PostType | null> = {
  all: null,
  photos: "image",
  videos: "video",
  media: "link",
};

export async function listPublished(
  db: D1Database,
  viewerId: string | null,
  tab: string,
): Promise<PostRow[]> {
  const type = TAB_TYPE[tab] ?? null;
  const sql =
    POST_SELECT +
    (type
      ? ` WHERE p.published = 1 AND p.type = ?2 ORDER BY p.created_at DESC`
      : ` WHERE p.published = 1 ORDER BY p.created_at DESC`);
  const stmt = type
    ? db.prepare(sql).bind(viewerId ?? "", type)
    : db.prepare(sql).bind(viewerId ?? "");
  const { results } = await stmt.all<PostRow>();
  return results;
}

export async function listAll(db: D1Database): Promise<PostRow[]> {
  const { results } = await db
    .prepare(POST_SELECT + ` ORDER BY p.created_at DESC`)
    .bind("")
    .all<PostRow>();
  return results;
}

export async function getById(
  db: D1Database,
  id: string,
  viewerId: string | null,
): Promise<PostRow | null> {
  return db
    .prepare(POST_SELECT + ` WHERE p.id = ?2`)
    .bind(viewerId ?? "", id)
    .first<PostRow>();
}

export interface CreatePostData {
  type: PostType;
  body: string;
  mediaKey?: string | null;
  mediaContentType?: string | null;
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkDescription?: string | null;
  linkImageUrl?: string | null;
  published: boolean;
}

export async function create(
  db: D1Database,
  data: CreatePostData,
): Promise<string> {
  const id = randomId();
  await db
    .prepare(
      `INSERT INTO posts (id, type, body, media_key, media_content_type,
         link_url, link_title, link_description, link_image_url, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      data.type,
      data.body,
      data.mediaKey ?? null,
      data.mediaContentType ?? null,
      data.linkUrl ?? null,
      data.linkTitle ?? null,
      data.linkDescription ?? null,
      data.linkImageUrl ?? null,
      data.published ? 1 : 0,
    )
    .run();
  return id;
}

export interface UpdatePostData {
  body?: string;
  published?: boolean;
  linkUrl?: string;
  linkTitle?: string | null;
  linkDescription?: string | null;
  linkImageUrl?: string | null;
}

export async function update(
  db: D1Database,
  id: string,
  data: UpdatePostData,
): Promise<boolean> {
  // Build the SET clause from a fixed column map — field names are ours,
  // only values are bound.
  const sets: string[] = [];
  const values: unknown[] = [];
  if (data.body !== undefined) {
    sets.push("body = ?");
    values.push(data.body);
  }
  if (data.published !== undefined) {
    sets.push("published = ?");
    values.push(data.published ? 1 : 0);
  }
  if (data.linkUrl !== undefined) {
    sets.push("link_url = ?");
    values.push(data.linkUrl);
  }
  if (data.linkTitle !== undefined) {
    sets.push("link_title = ?");
    values.push(data.linkTitle);
  }
  if (data.linkDescription !== undefined) {
    sets.push("link_description = ?");
    values.push(data.linkDescription);
  }
  if (data.linkImageUrl !== undefined) {
    sets.push("link_image_url = ?");
    values.push(data.linkImageUrl);
  }
  if (sets.length === 0) return true;
  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  const result = await db
    .prepare(`UPDATE posts SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values, id)
    .run();
  return result.meta.changes > 0;
}

/** Returns the deleted post's media_key (if any) so R2 can be cleaned up. */
export async function remove(
  db: D1Database,
  id: string,
): Promise<{ deleted: boolean; mediaKey: string | null }> {
  const row = await db
    .prepare(`SELECT media_key FROM posts WHERE id = ?`)
    .bind(id)
    .first<{ media_key: string | null }>();
  if (!row) return { deleted: false, mediaKey: null };
  await db.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
  return { deleted: true, mediaKey: row.media_key };
}
