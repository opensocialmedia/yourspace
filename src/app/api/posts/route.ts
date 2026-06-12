// GET /api/posts?tab=all|videos|photos|media — the gated feed.

import { handler } from "@/lib/api";
import { feedQuerySchema } from "@/lib/validation";
import { requireSubscriber } from "@/lib/services/security.service";
import * as postService from "@/lib/services/post.service";

export const GET = handler(async (request) => {
  const subscriberId = await requireSubscriber();
  const url = new URL(request.url);
  const { tab } = feedQuerySchema.parse({
    tab: url.searchParams.get("tab") ?? "all",
  });
  const posts = await postService.getFeed(subscriberId, tab);
  return Response.json({ posts });
});
