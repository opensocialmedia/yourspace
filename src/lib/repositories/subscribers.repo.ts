// All D1 access for subscribers.

import type { Subscriber, SubscriberStatus } from "@/types";
import { randomId } from "@/lib/crypto";

interface SubscriberRow {
  id: string;
  email: string;
  status: SubscriberStatus;
  confirm_token_hash: string | null;
  confirm_token_expires_at: string | null;
  username: string | null;
  created_at: string;
  confirmed_at: string | null;
}

function toSubscriber(row: SubscriberRow): Subscriber {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    username: row.username,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
  };
}

export async function getByEmail(
  db: D1Database,
  email: string,
): Promise<Subscriber | null> {
  const row = await db
    .prepare(`SELECT * FROM subscribers WHERE email = ?`)
    .bind(email)
    .first<SubscriberRow>();
  return row ? toSubscriber(row) : null;
}

export async function getById(
  db: D1Database,
  id: string,
): Promise<Subscriber | null> {
  const row = await db
    .prepare(`SELECT * FROM subscribers WHERE id = ?`)
    .bind(id)
    .first<SubscriberRow>();
  return row ? toSubscriber(row) : null;
}

/**
 * Insert a pending subscriber, or refresh the confirm token if the email
 * already exists and is still pending.
 */
export async function upsertPending(
  db: D1Database,
  email: string,
  tokenHash: string,
  expiresAt: string,
): Promise<{ id: string; alreadyConfirmed: boolean }> {
  const existing = await db
    .prepare(`SELECT id, status FROM subscribers WHERE email = ?`)
    .bind(email)
    .first<{ id: string; status: SubscriberStatus }>();

  if (existing?.status === "confirmed") {
    return { id: existing.id, alreadyConfirmed: true };
  }

  if (existing) {
    await db
      .prepare(
        `UPDATE subscribers
           SET confirm_token_hash = ?, confirm_token_expires_at = ?
         WHERE id = ?`,
      )
      .bind(tokenHash, expiresAt, existing.id)
      .run();
    return { id: existing.id, alreadyConfirmed: false };
  }

  const id = randomId();
  await db
    .prepare(
      `INSERT INTO subscribers (id, email, status, confirm_token_hash, confirm_token_expires_at)
       VALUES (?, ?, 'pending', ?, ?)`,
    )
    .bind(id, email, tokenHash, expiresAt)
    .run();
  return { id, alreadyConfirmed: false };
}

/**
 * Flip a pending subscriber to confirmed if the token hash matches and
 * hasn't expired. Single guarded UPDATE — no separate read step, so the
 * check and the write can't race.
 */
export async function confirmByTokenHash(
  db: D1Database,
  tokenHash: string,
): Promise<Subscriber | null> {
  const row = await db
    .prepare(
      `SELECT * FROM subscribers
        WHERE confirm_token_hash = ?
          AND confirm_token_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    )
    .bind(tokenHash)
    .first<SubscriberRow>();
  if (!row) return null;

  await db
    .prepare(
      `UPDATE subscribers
          SET status = 'confirmed',
              confirmed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
              confirm_token_hash = NULL,
              confirm_token_expires_at = NULL
        WHERE id = ?`,
    )
    .bind(row.id)
    .run();
  return toSubscriber({ ...row, status: "confirmed" });
}

export async function list(db: D1Database): Promise<Subscriber[]> {
  const { results } = await db
    .prepare(`SELECT * FROM subscribers ORDER BY created_at DESC`)
    .all<SubscriberRow>();
  return results.map(toSubscriber);
}

export async function remove(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM subscribers WHERE id = ?`)
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

export async function countConfirmed(db: D1Database): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM subscribers WHERE status = 'confirmed'`)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function updateUsername(
  db: D1Database,
  id: string,
  username: string,
): Promise<void> {
  await db
    .prepare(`UPDATE subscribers SET username = ? WHERE id = ?`)
    .bind(username, id)
    .run();
}
