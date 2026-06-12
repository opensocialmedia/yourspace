// GET  /api/admin/posts — every post, drafts included
// POST /api/admin/posts — create a post

import { handler, parseBody } from "@/lib/api";
import { postCreateSchema } from "@/lib/validation";
import {
  assertSameOrigin,
  requireAdmin,
} from "@/lib/services/security.service";
import * as postService from "@/lib/services/post.service";

export const GET = handler(async () => {
  await requireAdmin();
  const posts = await postService.adminListPosts();
  return Response.json({ posts });
});

export const POST = handler(async (request) => {
  await assertSameOrigin(request);
  await requireAdmin();
  const data = await parseBody(request, postCreateSchema);
  const id = await postService.adminCreatePost(data);
  return Response.json({ id }, { status: 201 });
});
