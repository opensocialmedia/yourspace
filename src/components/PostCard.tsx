"use client";

// One post in the feed: text, image, video, or shared-link preview, plus
// the reaction bar and collapsible comments.

import { useState } from "react";
import type { Post } from "@/types";
import { formatTimeAgo } from "@/components/format";
import { ReactionBar } from "@/components/ReactionBar";
import { CommentSection } from "@/components/CommentSection";

export function PostCard({
  post,
  authorName,
  avatarUrl,
}: {
  post: Post;
  authorName: string;
  avatarUrl: string | null;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <article className="border-b border-border-soft px-4 py-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-surface overflow-hidden shrink-0">
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px]">
            <span className="font-bold">{authorName}</span>{" "}
            <span className="text-muted">· {formatTimeAgo(post.createdAt)}</span>
          </p>

          {post.body && (
            <p className="mt-1 text-[15px] whitespace-pre-wrap break-words">
              {post.body}
            </p>
          )}

          {post.type === "image" && post.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt=""
              loading="lazy"
              className="mt-3 rounded-2xl border border-border-soft max-h-[600px] w-full object-cover"
            />
          )}

          {post.type === "video" && post.mediaUrl && (
            <video
              src={post.mediaUrl}
              controls
              preload="metadata"
              className="mt-3 rounded-2xl border border-border-soft w-full max-h-[600px] bg-black"
            />
          )}

          {post.type === "link" && post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-2xl border border-border-soft overflow-hidden hover:bg-surface transition-colors"
            >
              {post.linkImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.linkImageUrl}
                  alt=""
                  loading="lazy"
                  className="w-full max-h-64 object-cover"
                />
              )}
              <div className="p-3">
                <p className="text-[13px] text-muted">
                  {new URL(post.linkUrl).hostname}
                </p>
                {post.linkTitle && (
                  <p className="text-[15px] font-bold mt-0.5">{post.linkTitle}</p>
                )}
                {post.linkDescription && (
                  <p className="text-[14px] text-muted mt-0.5 line-clamp-2">
                    {post.linkDescription}
                  </p>
                )}
              </div>
            </a>
          )}

          <ReactionBar
            postId={post.id}
            likes={post.likeCount}
            dislikes={post.dislikeCount}
            commentCount={post.commentCount}
            viewerReaction={post.viewerReaction}
            onToggleComments={() => setCommentsOpen((v) => !v)}
          />

          <CommentSection postId={post.id} open={commentsOpen} />
        </div>
      </div>
    </article>
  );
}
