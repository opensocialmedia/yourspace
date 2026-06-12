// All D1 access for comments.

import type { Comment } from "@/types";
import { randomId } from "@/lib/crypto";

interface CommentRow {
  id: string;
  post_id: string;
  subscriber_id: string;
  username: string;
  body: string;
  created_at: string;
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    username: row.username,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function listByPost(
  db: D1Database,
  postId: string,
): Promise<Comment[]> {
  const { results } = await db
    .prepare(`SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC`)
    .bind(postId)
    .all<CommentRow>();
  return results.map(toComment);
}

/** Admin view: every comment, newest first, with the post id for context. */
export async function listAll(db: D1Database): Promise<Comment[]> {
  const { results } = await db
    .prepare(`SELECT * FROM comments ORDER BY created_at DESC`)
    .all<CommentRow>();
  return results.map(toComment);
}

export async function create(
  db: D1Database,
  data: { postId: string; subscriberId: string; username: string; body: string },
): Promise<Comment> {
  const id = randomId();
  await db
    .prepare(
      `INSERT INTO comments (id, post_id, subscriber_id, username, body)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, data.postId, data.subscriberId, data.username, data.body)
    .run();
  const row = await db
    .prepare(`SELECT * FROM comments WHERE id = ?`)
    .bind(id)
    .first<CommentRow>();
  return toComment(row!);
}

export async function remove(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM comments WHERE id = ?`)
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
