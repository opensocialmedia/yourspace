// All R2 access. Keys are generated here so callers can't write to
// arbitrary paths.

import { randomHex } from "@/lib/crypto";
import { R2_PUBLIC_PREFIX, R2_POSTS_PREFIX } from "@/lib/constants";

/** posts/<random>.<ext> — gated behind a subscriber session when served. */
export function newPostMediaKey(contentType: string): string {
  return `${R2_POSTS_PREFIX}${randomHex(16)}.${extensionFor(contentType)}`;
}

/** public/<kind>-<random>.<ext> — avatar/header, served to everyone. */
export function newPublicMediaKey(
  kind: "avatar" | "header",
  contentType: string,
): string {
  return `${R2_PUBLIC_PREFIX}${kind}-${randomHex(8)}.${extensionFor(contentType)}`;
}

function extensionFor(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[contentType] ?? "bin";
}

export async function put(
  bucket: R2Bucket,
  key: string,
  body: ReadableStream | ArrayBuffer,
  contentType: string,
): Promise<void> {
  await bucket.put(key, body, { httpMetadata: { contentType } });
}

export async function get(
  bucket: R2Bucket,
  key: string,
): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

export async function remove(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}
