// Media uploads (admin only) and gated serving from R2.

import { getConfig } from "@/lib/config";
import { validationError, payloadTooLarge, notFound, unauthorized } from "@/lib/errors";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  R2_PUBLIC_PREFIX,
} from "@/lib/constants";
import * as mediaRepo from "@/lib/repositories/media.repo";
import * as profileRepo from "@/lib/repositories/profile.repo";
import { getSubscriberId, isAdmin } from "@/lib/services/session.service";

export type UploadKind = "post" | "avatar" | "header";

export interface UploadResult {
  key: string;
  contentType: string;
  url: string;
}

export async function uploadMedia(
  file: File,
  kind: UploadKind,
): Promise<UploadResult> {
  const contentType = file.type;
  const isImage = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType);
  const isVideo = (ALLOWED_VIDEO_TYPES as readonly string[]).includes(contentType);

  if (kind === "post") {
    if (!isImage && !isVideo) {
      throw validationError(
        `Unsupported file type "${contentType}". Allowed: images (jpeg/png/webp/gif/avif) and video (mp4/webm/mov)`,
      );
    }
  } else if (!isImage) {
    // Avatar and header must be images.
    throw validationError(`The ${kind} must be an image`);
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    throw payloadTooLarge(
      `File too large — max ${Math.floor(maxBytes / 1024 / 1024)} MB for ${isVideo ? "video" : "images"}`,
    );
  }

  const { media, db } = await getConfig();
  const key =
    kind === "post"
      ? mediaRepo.newPostMediaKey(contentType)
      : mediaRepo.newPublicMediaKey(kind, contentType);

  await mediaRepo.put(media, key, file.stream(), contentType);

  // Avatar/header uploads update the profile pointer immediately.
  if (kind === "avatar") await profileRepo.updateAvatarKey(db, key);
  if (kind === "header") await profileRepo.updateHeaderKey(db, key);

  return { key, contentType, url: `/api/media/${key}` };
}

/**
 * Stream an object from R2. "public/" keys (avatar, header) are open to
 * everyone; everything else requires a confirmed subscriber or admin
 * session — the storage layer enforces the same gate as the feed.
 */
export async function serveMedia(key: string): Promise<Response> {
  if (key.includes("..")) throw notFound();

  if (!key.startsWith(R2_PUBLIC_PREFIX)) {
    const allowed = (await getSubscriberId()) !== null || (await isAdmin());
    if (!allowed) throw unauthorized("Subscribe to view media");
  }

  const { media } = await getConfig();
  const object = await mediaRepo.get(media, key);
  if (!object) throw notFound();

  const headers = new Headers();
  headers.set(
    "content-type",
    object.httpMetadata?.contentType ?? "application/octet-stream",
  );
  headers.set("etag", object.httpEtag);
  // Immutable: keys are random, content at a key never changes.
  headers.set("cache-control", "private, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
