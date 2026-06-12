"use client";

// Like / dislike / comment-count / share row under each post.

import { useReactions } from "@/hooks/use-reactions";
import { formatCount } from "@/components/format";
import { ShareButton } from "@/components/ShareButton";

export function ReactionBar({
  postId,
  likes,
  dislikes,
  commentCount,
  viewerReaction,
  onToggleComments,
}: {
  postId: string;
  likes: number;
  dislikes: number;
  commentCount: number;
  viewerReaction: "like" | "dislike" | null;
  onToggleComments?: () => void;
}) {
  const reaction = useReactions(postId, {
    likes,
    dislikes,
    viewerReaction,
  });

  return (
    <div className="mt-3 flex items-center gap-6 text-muted text-[14px]">
      <button
        onClick={() => reaction.react("like")}
        disabled={reaction.busy}
        className={`flex items-center gap-1.5 hover:text-green-400 transition-colors ${
          reaction.viewerReaction === "like" ? "text-green-400" : ""
        }`}
        aria-label="Like"
      >
        <span>👍</span>
        {formatCount(reaction.likes)}
      </button>

      <button
        onClick={() => reaction.react("dislike")}
        disabled={reaction.busy}
        className={`flex items-center gap-1.5 hover:text-red-400 transition-colors ${
          reaction.viewerReaction === "dislike" ? "text-red-400" : ""
        }`}
        aria-label="Dislike"
      >
        <span>👎</span>
        {formatCount(reaction.dislikes)}
      </button>

      <button
        onClick={onToggleComments}
        className="flex items-center gap-1.5 hover:text-accent transition-colors"
        aria-label="Comments"
      >
        <span>💬</span>
        {formatCount(commentCount)}
      </button>

      <ShareButton postId={postId} />
    </div>
  );
}
