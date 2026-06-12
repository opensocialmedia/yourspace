// Business rules for posts: what makes each post type valid.

import type { PostType } from "@/types";
import { validationError } from "@/lib/errors";

export interface PostInput {
  type: PostType;
  body: string;
  mediaKey?: string | null;
  linkUrl?: string | null;
}

/** Throws a validation AppError if the post breaks a business rule. */
export function assertPostRules(input: PostInput): void {
  switch (input.type) {
    case "text":
      if (!input.body.trim()) {
        throw validationError("A text post needs some text");
      }
      break;
    case "image":
    case "video":
      if (!input.mediaKey) {
        throw validationError(`A ${input.type} post needs an uploaded file`);
      }
      break;
    case "link":
      if (!input.linkUrl) {
        throw validationError("A link post needs a URL");
      }
      try {
        const url = new URL(input.linkUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          throw new Error();
        }
      } catch {
        throw validationError("Link URL must be a valid http(s) URL");
      }
      break;
  }
}
