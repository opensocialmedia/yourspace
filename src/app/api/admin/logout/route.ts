// POST /api/admin/logout — clears the admin session cookie.

import { handler } from "@/lib/api";
import { assertSameOrigin } from "@/lib/services/security.service";
import * as authService from "@/lib/services/auth.service";

export const POST = handler(async (request) => {
  await assertSameOrigin(request);
  await authService.adminLogout();
  return Response.json({ ok: true });
});
