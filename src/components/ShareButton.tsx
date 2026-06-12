"use client";

// Share a post: native share sheet where available, clipboard fallback.
// The link goes straight to /post/<id>, which carries OG preview tags.

import { useState } from "react";

export function ShareButton({ postId }: { postId: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // fall through to clipboard if the user dismissed the sheet
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={share}
      className="flex items-center gap-1.5 hover:text-accent transition-colors ml-auto"
      aria-label="Share"
    >
      <span>↗</span>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
