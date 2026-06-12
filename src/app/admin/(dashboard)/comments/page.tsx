// /admin/comments — moderation: every comment, with delete.

import type { Metadata } from "next";
import * as commentService from "@/lib/services/comment.service";
import { AdminCommentsTable } from "@/components/admin/AdminCommentsTable";

export const metadata: Metadata = {
  title: "Admin · Comments",
  robots: { index: false, follow: false },
};

export default async function AdminCommentsPage() {
  const comments = await commentService.adminListComments();
  return <AdminCommentsTable comments={comments} />;
}
