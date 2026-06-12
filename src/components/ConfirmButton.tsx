"use client";

// The "Confirm my email" button on /confirm. POSTs the token; success
// sets the subscriber session cookie and sends them to the feed.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/hooks/use-api";

export function ConfirmButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/subscribers/confirm", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong — try again",
      );
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={confirm}
        disabled={busy}
        className="w-full rounded-full bg-accent py-2.5 font-bold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {busy ? "Confirming…" : "Confirm my email"}
      </button>
      {error && <p className="mt-3 text-[14px] text-red-400">{error}</p>}
    </>
  );
}
