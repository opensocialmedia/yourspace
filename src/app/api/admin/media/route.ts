// POST /api/admin/media — multipart upload to R2.
// Fields: file (the upload), kind ("post" | "avatar" | "header").

import { handler } from "@/lib/api";
import { validationError } from "@/lib/errors";
import {
  assertSameOrigin,
  requireAdmin,
} from "@/lib/services/security.service";
import * as mediaService from "@/lib/services/media.service";

export const POST = handler(async (request) => {
  await assertSameOrigin(request);
  await requireAdmin();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw validationError("Expected multipart form data");
  }

  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File)) throw validationError("Missing file");
  if (kind !== "post" && kind !== "avatar" && kind !== "header") {
    throw validationError('kind must be "post", "avatar" or "header"');
  }

  const result = await mediaService.uploadMedia(file, kind);
  return Response.json(result, { status: 201 });
});
