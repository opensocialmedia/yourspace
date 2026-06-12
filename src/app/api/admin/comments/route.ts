// GET /api/admin/comments — all comments for moderation.

import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/services/security.service";
import * as commentService from "@/lib/services/comment.service";

export const GET = handler(async () => {
  await requireAdmin();
  const comments = await commentService.adminListComments();
  return Response.json({ comments });
});
