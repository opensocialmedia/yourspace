// DELETE /api/admin/comments/:id — remove a comment.

import { handler } from "@/lib/api";
import {
  assertSameOrigin,
  requireAdmin,
} from "@/lib/services/security.service";
import * as commentService from "@/lib/services/comment.service";

export const DELETE = handler<{ id: string }>(async (request, { params }) => {
  await assertSameOrigin(request);
  await requireAdmin();
  const { id } = await params;
  await commentService.adminDeleteComment(id);
  return Response.json({ ok: true });
});
