"use client";

// What non-subscribers see instead of the feed: blurred placeholders and
// the email-capture form with the Turnstile human check.

import { useState } from "react";
import { useSubscribe } from "@/hooks/use-subscribe";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export function FollowGate({
  postCount,
  turnstileSiteKey,
  displayName,
}: {
  postCount: number;
  turnstileSiteKey: string;
  displayName: string;
}) {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { state, subscribe } = useSubscribe();

  if (state.phase === "sent") {
    return (
      <div className="mt-6 mx-4 rounded-2xl border border-border-soft bg-surface p-8 text-center">
        <p className="text-2xl mb-2">📬</p>
        <h2 className="text-lg font-bold mb-1">Check your inbox</h2>
        <p className="text-muted text-[15px]">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="relative mt-2">
      {/* Teaser skeletons standing in for the hidden posts. The real
          content was never sent to the browser — this is purely visual. */}
      <div className="space-y-4 px-4 pt-4" aria-hidden>
        {Array.from({ length: Math.min(Math.max(postCount, 1), 3) }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-soft p-4 blur-[6px] select-none"
          >
            <div className="h-4 w-1/3 rounded bg-surface mb-3" />
            <div className="h-3 w-full rounded bg-surface mb-2" />
            <div className="h-3 w-2/3 rounded bg-surface" />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex items-start justify-center bg-gradient-to-b from-transparent via-background/80 to-background pt-10">
        <form
          className="w-full max-w-sm mx-4 rounded-2xl border border-border-soft bg-surface p-6 shadow-xl"
          onSubmit={(e) => {
            e.preventDefault();
            if (turnstileToken) subscribe(email, turnstileToken);
          }}
        >
          <h2 className="text-lg font-bold">
            Follow {displayName} to unlock the feed
          </h2>
          <p className="mt-1 text-[14px] text-muted">
            {postCount} post{postCount === 1 ? "" : "s"} waiting. Drop your
            email, confirm it, and everything opens up.
          </p>

          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-4 w-full rounded-full border border-border-soft bg-background px-4 py-2.5 text-[15px] outline-none focus:border-accent"
          />

          <div className="mt-3">
            <TurnstileWidget
              siteKey={turnstileSiteKey}
              onToken={setTurnstileToken}
            />
          </div>

          <button
            type="submit"
            disabled={state.phase === "submitting" || !turnstileToken}
            className="mt-3 w-full rounded-full bg-accent py-2.5 font-bold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {state.phase === "submitting" ? "Sending…" : "Follow"}
          </button>

          {state.phase === "error" && (
            <p className="mt-3 text-[14px] text-red-400">{state.message}</p>
          )}

          <p className="mt-3 text-[12px] text-muted">
            Double opt-in: nothing is stored as confirmed until you click the
            link we email you. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );
}
