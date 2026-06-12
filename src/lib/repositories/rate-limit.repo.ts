// Fixed-window rate limiting backed by D1. Good enough for a personal
// site; swap for Durable Objects if you ever need strict guarantees.

export async function hit(
  db: D1Database,
  key: string,
  windowSeconds: number,
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);

  // Reset the row when a new window starts, otherwise bump the counter.
  await db
    .prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN window_start = excluded.window_start THEN count + 1 ELSE 1 END,
         window_start = excluded.window_start`,
    )
    .bind(key, windowStart)
    .run();

  const row = await db
    .prepare(`SELECT count FROM rate_limits WHERE key = ?`)
    .bind(key)
    .first<{ count: number }>();
  return row?.count ?? 1;
}
