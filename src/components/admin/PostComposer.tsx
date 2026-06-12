"use client";

// Create a post of any of the four types. Image/video uploads go to
// /api/admin/media first; the returned R2 key is attached to the post.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PostType } from "@/types";
import { apiFetch, ApiError } from "@/hooks/use-api";

const TYPES: { id: PostType; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "link", label: "Link" },
];

export function PostComposer() {
  const router = useRouter();
  const [type, setType] = useState<PostType>("text");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkImageUrl, setLinkImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let payload: Record<string, unknown> = { type, body, published: true };

      if (type === "image" || type === "video") {
        if (!file) throw new ApiError("Choose a file first", 400);
        const form = new FormData();
        form.set("file", file);
        form.set("kind", "post");
        const uploaded = await apiFetch<{ key: string; contentType: string }>(
          "/api/admin/media",
          { method: "POST", body: form },
        );
        payload = {
          ...payload,
          mediaKey: uploaded.key,
          mediaContentType: uploaded.contentType,
        };
      }

      if (type === "link") {
        payload = {
          ...payload,
          linkUrl,
          linkTitle: linkTitle || undefined,
          linkDescription: linkDescription || undefined,
          linkImageUrl: linkImageUrl || undefined,
        };
      }

      await apiFetch("/api/admin/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setBody("");
      setFile(null);
      setLinkUrl("");
      setLinkTitle("");
      setLinkDescription("");
      setLinkImageUrl("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create post");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border-soft bg-background px-3 py-2 text-[14px] outline-none focus:border-accent";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border-soft bg-surface p-5 space-y-3"
    >
      <div className="flex gap-1">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
              type === t.id
                ? "bg-accent text-white font-bold"
                : "border border-border-soft text-muted hover:bg-background"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        rows={3}
        placeholder={type === "text" ? "What's happening?" : "Caption (optional)"}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className={`${inputClass} resize-none`}
      />

      {(type === "image" || type === "video") && (
        <input
          type="file"
          accept={type === "image" ? "image/*" : "video/*"}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-[14px] text-muted file:mr-3 file:rounded-full file:border-0 file:bg-background file:px-4 file:py-1.5 file:text-foreground"
        />
      )}

      {type === "link" && (
        <div className="space-y-2">
          <input type="url" required placeholder="https://… (the link to share)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Preview title (optional)" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Preview description (optional)" value={linkDescription} onChange={(e) => setLinkDescription(e.target.value)} className={inputClass} />
          <input type="url" placeholder="Preview image URL (optional)" value={linkImageUrl} onChange={(e) => setLinkImageUrl(e.target.value)} className={inputClass} />
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-accent px-6 py-2 text-[14px] font-bold text-white disabled:opacity-50"
      >
        {busy ? "Posting…" : "Post"}
      </button>
      {error && <p className="text-[14px] text-red-400">{error}</p>}
    </form>
  );
}
