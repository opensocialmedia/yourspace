// Crypto primitives built only on WebCrypto, so they run identically on
// Cloudflare Workers and in local Node dev. No external dependencies.

const encoder = new TextEncoder();

/** Cryptographically random hex string (default 32 bytes → 64 chars). */
export function randomHex(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Short random id for primary keys (16 bytes → 32 hex chars). */
export function randomId(): string {
  return randomHex(16);
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison. Hashes both sides first so length
 * differences leak nothing either.
 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

// ── HMAC-signed tokens (used for session cookies) ────────────────────
// Format: base64url(payload-json) + "." + base64url(hmac-sha256)

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export interface TokenPayload {
  /** Subject — subscriber id, or "admin". */
  sub: string;
  /** Role this token grants. */
  role: "subscriber" | "admin";
  /** Expiry, unix seconds. */
  exp: number;
}

export async function signToken(
  payload: TokenPayload,
  secret: string,
): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

/** Returns the payload if the token is authentic and unexpired, else null. */
export async function verifyToken(
  token: string,
  secret: string,
): Promise<TokenPayload | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sig),
      encoder.encode(body),
    );
    if (!ok) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as TokenPayload;
    if (
      typeof payload.sub !== "string" ||
      (payload.role !== "subscriber" && payload.role !== "admin") ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
