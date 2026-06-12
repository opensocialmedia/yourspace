// PUT    /api/admin/posts/:id — edit a post
// DELETE /api/admin/posts/:id — delete a post (and its R2 media)

import { handler, parseBody } from "@/lib/api";
import { postUpdateSchema } from "@/lib/validation";
import {
  assertSameOrigin,
  requireAdmin,
} from "@/lib/services/security.service";
import * as postService from "@/lib/services/post.service";

export const PUT = handler<{ id: string }>(async (request, { params }) => {
  await assertSameOrigin(request);
  await requireAdmin();
  const { id } = await params;
  const data = await parseBody(request, postUpdateSchema);
  await postService.adminUpdatePost(id, data);
  return Response.json({ ok: true });
});

export const DELETE = handler<{ id: string }>(async (request, { params }) => {
  await assertSameOrigin(request);
  await requireAdmin();
  const { id } = await params;
  await postService.adminDeletePost(id);
  return Response.json({ ok: true });
});
