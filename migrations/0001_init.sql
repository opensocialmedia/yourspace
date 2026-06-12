-- ─────────────────────────────────────────────────────────────────────
-- yourspace — initial D1 schema
-- Apply locally:   npm run db:migrate:local
-- Apply to prod:   npm run db:migrate:remote
-- ─────────────────────────────────────────────────────────────────────

-- The site owner's profile. Exactly one row, enforced by the CHECK.
CREATE TABLE profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar_key TEXT,                -- R2 object key for the profile picture
  header_key TEXT,                -- R2 object key for the header photo
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Links shown under the bio. Add as many as you like.
CREATE TABLE profile_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('text','image','video','link')),
  body TEXT NOT NULL DEFAULT '',
  media_key TEXT,                 -- R2 key (image/video posts)
  media_content_type TEXT,
  link_url TEXT,                  -- link posts: the shared URL
  link_title TEXT,
  link_description TEXT,
  link_image_url TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX idx_posts_type ON posts (type);

CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed')),
  -- We store a SHA-256 hash of the confirmation token, never the token
  -- itself, so a leaked database can't be used to forge confirmations.
  confirm_token_hash TEXT,
  confirm_token_expires_at TEXT,
  username TEXT,                  -- comment handle (random or self-chosen)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  confirmed_at TEXT
);
CREATE INDEX idx_subscribers_status ON subscribers (status);
CREATE INDEX idx_subscribers_token ON subscribers (confirm_token_hash);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_comments_post_id ON comments (post_id, created_at);

-- One reaction (like OR dislike) per subscriber per post.
CREATE TABLE reactions (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('like','dislike')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (post_id, subscriber_id)
);

-- Fixed-window rate-limit counters (login attempts, subscribe attempts…).
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

-- Default profile so the site renders before you've touched the admin
-- page. REPLACE via /admin → Profile (no code edit needed).
INSERT INTO profile (id, display_name, bio)
VALUES (1, 'Venya Sneekers', 'Welcome to my corner of the internet. Follow to see what I''m up to.');
