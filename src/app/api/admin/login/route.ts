// POST /api/admin/login — exchange the admin password for a session.

import { handler, parseBody } from "@/lib/api";
import { adminLoginSchema } from "@/lib/validation";
import {
  assertSameOrigin,
  getClientIp,
} from "@/lib/services/security.service";
import * as authService from "@/lib/services/auth.service";

export const POST = handler(async (request) => {
  await assertSameOrigin(request);
  const { password } = await parseBody(request, adminLoginSchema);
  await authService.adminLogin(password, getClientIp(request));
  return Response.json({ ok: true });
});
