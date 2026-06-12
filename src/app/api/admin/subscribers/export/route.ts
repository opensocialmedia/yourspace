// GET /api/admin/subscribers/export — download the list as CSV.

import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/services/security.service";
import * as subscriberService from "@/lib/services/subscriber.service";

export const GET = handler(async () => {
  await requireAdmin();
  const csv = await subscriberService.exportSubscribersCsv();
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
