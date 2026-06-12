// DELETE /api/admin/subscribers/:id — remove/unsubscribe an email.
// Their comments and reactions cascade away with them.

import { handler } from "@/lib/api";
import {
  assertSameOrigin,
  requireAdmin,
} from "@/lib/services/security.service";
import * as subscriberService from "@/lib/services/subscriber.service";

export const DELETE = handler<{ id: string }>(async (request, { params }) => {
  await assertSameOrigin(request);
  await requireAdmin();
  const { id } = await params;
  await subscriberService.deleteSubscriber(id);
  return Response.json({ ok: true });
});
