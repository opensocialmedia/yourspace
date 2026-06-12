// Every hardcoded value in the app lives here, named and explained.
// Tweak these freely — nothing else needs to change.

// ── Content limits ───────────────────────────────────────────────────
export const MAX_POST_BODY_LENGTH = 10_000;
export const MAX_COMMENT_LENGTH = 1_000;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const MAX_BIO_LENGTH = 1_000;
export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MAX_PROFILE_LINKS = 20;
export const FEED_PAGE_SIZE = 20;

// ── Media upload limits (admin uploads to R2) ────────────────────────
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 95 * 1024 * 1024; // Workers cap request bodies at 100 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

// R2 key prefixes. "public/" objects (avatar, header) are served without
// a subscriber session; "posts/" objects require one.
export const R2_PUBLIC_PREFIX = "public/";
export const R2_POSTS_PREFIX = "posts/";

// ── Sessions & tokens ────────────────────────────────────────────────
export const SUBSCRIBER_COOKIE = "ys_sub";
export const ADMIN_COOKIE = "ys_admin";
export const SUBSCRIBER_SESSION_DAYS = 180;
export const ADMIN_SESSION_HOURS = 24;
export const CONFIRM_TOKEN_TTL_HOURS = 24;

// ── Rate limits (fixed window, per key) ──────────────────────────────
export const RATE_LIMITS = {
  adminLogin: { max: 5, windowSeconds: 15 * 60 },
  subscribe: { max: 5, windowSeconds: 60 * 60 },
  comment: { max: 10, windowSeconds: 60 },
  reaction: { max: 60, windowSeconds: 60 },
} as const;

// ── Random username word bank ────────────────────────────────────────
// Combined as Adjective + Noun + 2-digit number, e.g. "CosmicWalrus42".
export const USERNAME_ADJECTIVES = [
  "Cosmic", "Mellow", "Turbo", "Sneaky", "Velvet", "Neon", "Rusty",
  "Quantum", "Dizzy", "Golden", "Frosty", "Wobbly", "Electric", "Salty",
  "Lunar", "Peppy", "Shadow", "Crispy", "Bouncy", "Mystic", "Groovy",
  "Plucky", "Zesty", "Drowsy", "Atomic", "Breezy", "Chunky", "Daring",
  "Echoing", "Fuzzy", "Glossy", "Hasty", "Icy", "Jolly", "Kindly",
  "Loopy", "Nimble", "Orbiting", "Prickly", "Quirky",
] as const;

export const USERNAME_NOUNS = [
  "Walrus", "Falcon", "Noodle", "Comet", "Badger", "Pickle", "Wizard",
  "Mango", "Otter", "Rocket", "Cactus", "Penguin", "Waffle", "Yeti",
  "Lobster", "Bandit", "Donut", "Ferret", "Gecko", "Hamster", "Iguana",
  "Jackal", "Koala", "Lemur", "Marmot", "Narwhal", "Ocelot", "Panda",
  "Quokka", "Raccoon", "Sloth", "Toucan", "Urchin", "Viper", "Wombat",
  "Axolotl", "Bison", "Condor", "Dingo", "Echidna",
] as const;
