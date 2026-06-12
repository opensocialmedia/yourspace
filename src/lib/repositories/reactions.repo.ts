// All D1 access for likes/dislikes. One row per (post, subscriber);
// reacting again with the same kind removes it (toggle), a different
// kind replaces it.

export async function setReaction(
  db: D1Database,
  postId: string,
  subscriberId: string,
  kind: "like" | "dislike",
): Promise<"added" | "removed" | "changed"> {
  const existing = await db
    .prepare(`SELECT kind FROM reactions WHERE post_id = ? AND subscriber_id = ?`)
    .bind(postId, subscriberId)
    .first<{ kind: string }>();

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO reactions (post_id, subscriber_id, kind) VALUES (?, ?, ?)`,
      )
      .bind(postId, subscriberId, kind)
      .run();
    return "added";
  }

  if (existing.kind === kind) {
    await db
      .prepare(`DELETE FROM reactions WHERE post_id = ? AND subscriber_id = ?`)
      .bind(postId, subscriberId)
      .run();
    return "removed";
  }

  await db
    .prepare(
      `UPDATE reactions SET kind = ? WHERE post_id = ? AND subscriber_id = ?`,
    )
    .bind(kind, postId, subscriberId)
    .run();
  return "changed";
}

export async function getCounts(
  db: D1Database,
  postId: string,
): Promise<{ likes: number; dislikes: number }> {
  const row = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN kind = 'like' THEN 1 ELSE 0 END) AS likes,
         SUM(CASE WHEN kind = 'dislike' THEN 1 ELSE 0 END) AS dislikes
       FROM reactions WHERE post_id = ?`,
    )
    .bind(postId)
    .first<{ likes: number | null; dislikes: number | null }>();
  return { likes: row?.likes ?? 0, dislikes: row?.dislikes ?? 0 };
}
