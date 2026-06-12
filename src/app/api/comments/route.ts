// GET  /api/comments?postId=… — comments on a post (subscribers only)
// POST /api/comments          — leave a comment (subscribers only)

import { handler, parseBody } from "@/lib/api";
import { commentSchema } from "@/lib/validation";
import { validationError } from "@/lib/errors";
import {
  assertSameOrigin,
  enforceRateLimit,
  requireSubscriber,
} from "@/lib/services/security.service";
import * as commentService from "@/lib/services/comment.service";

export const GET = handler(async (request) => {
  await requireSubscriber();
  const postId = new URL(request.url).searchParams.get("postId");
  if (!postId || !/^[0-9a-f]{32}$/.test(postId)) {
    throw validationError("postId is required");
  }
  const comments = await commentService.listComments(postId);
  return Response.json({ comments });
});

export const POST = handler(async (request) => {
  await assertSameOrigin(request);
  const subscriberId = await requireSubscriber();
  await enforceRateLimit("comment", subscriberId);

  const { postId, body, username } = await parseBody(request, commentSchema);
  const comment = await commentService.addComment(
    subscriberId,
    postId,
    body,
    username,
  );
  return Response.json({ comment }, { status: 201 });
});
