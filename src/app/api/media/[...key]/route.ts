// GET /api/media/<r2-key> — streams objects from R2. Profile images
// (public/…) are open; post media requires a subscriber session. The
// gate lives in media.service.serveMedia.

import { handler } from "@/lib/api";
import { serveMedia } from "@/lib/services/media.service";

export const GET = handler<{ key: string[] }>(async (_request, { params }) => {
  const { key } = await params;
  return serveMedia(key.join("/"));
});
