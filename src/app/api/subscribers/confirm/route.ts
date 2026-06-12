// POST /api/subscribers/confirm — step 2 of double opt-in. Called by the
// button on /confirm (a POST so inbox link-prefetchers can't trigger it).

import { handler, parseBody } from "@/lib/api";
import { confirmSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/services/security.service";
import * as subscriberService from "@/lib/services/subscriber.service";

export const POST = handler(async (request) => {
  await assertSameOrigin(request);
  const { token } = await parseBody(request, confirmSchema);
  await subscriberService.confirm(token); // sets the session cookie
  return Response.json({ ok: true });
});
