// Zod schemas — the shapes incoming request data must match before any
// service will touch it. Parse failures become 400s in the API layer.

import { z } from "zod";
import {
  MAX_COMMENT_LENGTH,
  MAX_POST_BODY_LENGTH,
  MAX_USERNAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_PROFILE_LINKS,
} from "@/lib/constants";

const httpUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
    message: "Must be an http(s) URL",
  });

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  turnstileToken: z.string().min(1).max(4096),
});

export const confirmSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/, "Malformed token"),
});

export const commentSchema = z.object({
  postId: z.string().regex(/^[0-9a-f]{32}$/),
  body: z.string().trim().min(1).max(MAX_COMMENT_LENGTH),
  username: z.string().trim().max(MAX_USERNAME_LENGTH).optional(),
});

export const reactionSchema = z.object({
  postId: z.string().regex(/^[0-9a-f]{32}$/),
  kind: z.enum(["like", "dislike"]),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(1024),
});

const basePost = {
  body: z.string().max(MAX_POST_BODY_LENGTH).default(""),
  published: z.boolean().default(true),
};

export const postCreateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), ...basePost }),
  z.object({
    type: z.literal("image"),
    ...basePost,
    mediaKey: z.string().min(1).max(512),
    mediaContentType: z.string().min(1).max(128),
  }),
  z.object({
    type: z.literal("video"),
    ...basePost,
    mediaKey: z.string().min(1).max(512),
    mediaContentType: z.string().min(1).max(128),
  }),
  z.object({
    type: z.literal("link"),
    ...basePost,
    linkUrl: httpUrl,
    linkTitle: z.string().trim().max(300).optional(),
    linkDescription: z.string().trim().max(1000).optional(),
    linkImageUrl: httpUrl.optional(),
  }),
]);

export const postUpdateSchema = z.object({
  body: z.string().max(MAX_POST_BODY_LENGTH).optional(),
  published: z.boolean().optional(),
  linkUrl: httpUrl.optional(),
  linkTitle: z.string().trim().max(300).nullish(),
  linkDescription: z.string().trim().max(1000).nullish(),
  linkImageUrl: httpUrl.nullish(),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(MAX_DISPLAY_NAME_LENGTH),
  bio: z.string().trim().max(MAX_BIO_LENGTH),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(100),
        url: httpUrl,
      }),
    )
    .max(MAX_PROFILE_LINKS),
});

export const feedQuerySchema = z.object({
  tab: z.enum(["all", "videos", "photos", "media"]).default("all"),
});
