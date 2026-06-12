// GET /api/admin/subscribers — the email list (confirmed + pending).

import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/services/security.service";
import * as subscriberService from "@/lib/services/subscriber.service";

export const GET = handler(async () => {
  await requireAdmin();
  const subscribers = await subscriberService.listSubscribers();
  return Response.json({ subscribers });
});
