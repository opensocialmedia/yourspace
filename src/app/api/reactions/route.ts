// PUT /api/reactions — toggle a like/dislike (subscribers only).

import { handler, parseBody } from "@/lib/api";
import { reactionSchema } from "@/lib/validation";
import {
  assertSameOrigin,
  enforceRateLimit,
  requireSubscriber,
} from "@/lib/services/security.service";
import * as reactionService from "@/lib/services/reaction.service";

export const PUT = handler(async (request) => {
  await assertSameOrigin(request);
  const subscriberId = await requireSubscriber();
  await enforceRateLimit("reaction", subscriberId);

  const { postId, kind } = await parseBody(request, reactionSchema);
  const result = await reactionService.react(subscriberId, postId, kind);
  return Response.json(result);
});
