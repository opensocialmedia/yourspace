// PUT /api/admin/profile — update display name, bio, and links.

import { handler, parseBody } from "@/lib/api";
import { profileUpdateSchema } from "@/lib/validation";
import {
  assertSameOrigin,
  requireAdmin,
} from "@/lib/services/security.service";
import * as profileService from "@/lib/services/profile.service";

export const PUT = handler(async (request) => {
  await assertSameOrigin(request);
  await requireAdmin();
  const data = await parseBody(request, profileUpdateSchema);
  await profileService.updateProfile(data);
  return Response.json({ ok: true });
});
