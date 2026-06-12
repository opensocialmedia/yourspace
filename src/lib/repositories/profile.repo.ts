// All D1 access for the owner profile and its links.

export interface ProfileRow {
  display_name: string;
  bio: string;
  avatar_key: string | null;
  header_key: string | null;
}

export interface ProfileLinkRow {
  id: number;
  label: string;
  url: string;
  sort_order: number;
}

export async function getProfile(db: D1Database): Promise<ProfileRow | null> {
  return db.prepare(`SELECT * FROM profile WHERE id = 1`).first<ProfileRow>();
}

export async function getLinks(db: D1Database): Promise<ProfileLinkRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM profile_links ORDER BY sort_order ASC, id ASC`)
    .all<ProfileLinkRow>();
  return results;
}

export async function updateProfile(
  db: D1Database,
  data: { displayName: string; bio: string },
): Promise<void> {
  await db
    .prepare(
      `UPDATE profile
          SET display_name = ?, bio = ?,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE id = 1`,
    )
    .bind(data.displayName, data.bio)
    .run();
}

export async function updateAvatarKey(
  db: D1Database,
  key: string,
): Promise<void> {
  await db
    .prepare(`UPDATE profile SET avatar_key = ? WHERE id = 1`)
    .bind(key)
    .run();
}

export async function updateHeaderKey(
  db: D1Database,
  key: string,
): Promise<void> {
  await db
    .prepare(`UPDATE profile SET header_key = ? WHERE id = 1`)
    .bind(key)
    .run();
}

/** Replace the whole link list in one batch (delete + reinsert). */
export async function replaceLinks(
  db: D1Database,
  links: { label: string; url: string }[],
): Promise<void> {
  const statements = [
    db.prepare(`DELETE FROM profile_links`),
    ...links.map((link, i) =>
      db
        .prepare(
          `INSERT INTO profile_links (label, url, sort_order) VALUES (?, ?, ?)`,
        )
        .bind(link.label, link.url, i),
    ),
  ];
  await db.batch(statements);
}
