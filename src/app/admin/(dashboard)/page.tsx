// /admin — post management: compose new, edit/delete existing.

import type { Metadata } from "next";
import * as postService from "@/lib/services/post.service";
import { PostComposer } from "@/components/admin/PostComposer";
import { AdminPostList } from "@/components/admin/AdminPostList";

export const metadata: Metadata = {
  title: "Admin · Posts",
  robots: { index: false, follow: false },
};

export default async function AdminPostsPage() {
  const posts = await postService.adminListPosts();
  return (
    <div className="space-y-8">
      <PostComposer />
      <AdminPostList posts={posts} />
    </div>
  );
}
