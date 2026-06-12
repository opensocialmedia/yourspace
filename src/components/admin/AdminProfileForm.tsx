"use client";

// Profile editor: name, bio, links, avatar + header uploads.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";
import { apiFetch, ApiError } from "@/hooks/use-api";

export function AdminProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [links, setLinks] = useState(
    profile.links.map((l) => ({ label: l.label, url: l.url })),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-xl border border-border-soft bg-background px-3 py-2 text-[14px] outline-none focus:border-accent";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/api/admin/profile", {
        method: "PUT",
        body: JSON.stringify({
          displayName,
          bio,
          links: links.filter((l) => l.label.trim() && l.url.trim()),
        }),
      });
      setMessage("Saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  }

  async function upload(kind: "avatar" | "header", file: File) {
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", kind);
      await apiFetch("/api/admin/media", { method: "POST", body: form });
      setMessage(`${kind === "avatar" ? "Profile picture" : "Header"} updated`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    }
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[13px] text-muted">Profile picture</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload("avatar", f);
            }}
            className="mt-1 block w-full text-[13px] text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-1.5 file:text-foreground"
          />
        </label>
        <label className="block">
          <span className="text-[13px] text-muted">Header photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload("header", f);
            }}
            className="mt-1 block w-full text-[13px] text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-1.5 file:text-foreground"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[13px] text-muted">Display name</span>
        <input
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </label>

      <label className="block">
        <span className="text-[13px] text-muted">Bio</span>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={`mt-1 ${inputClass} resize-none`}
        />
      </label>

      <div>
        <span className="text-[13px] text-muted">Links</span>
        <div className="mt-1 space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder="Label"
                value={link.label}
                onChange={(e) =>
                  setLinks(links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))
                }
                className={`${inputClass} !w-40`}
              />
              <input
                type="url"
                placeholder="https://…"
                value={link.url}
                onChange={(e) =>
                  setLinks(links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)))
                }
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setLinks(links.filter((_, j) => j !== i))}
                className="text-red-400 text-[13px] shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLinks([...links, { label: "", url: "" }])}
            className="text-[13px] text-accent hover:underline"
          >
            + Add link
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-6 py-2 text-[14px] font-bold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
        {message && <span className="text-[14px] text-green-400">{message}</span>}
        {error && <span className="text-[14px] text-red-400">{error}</span>}
      </div>
    </form>
  );
}
