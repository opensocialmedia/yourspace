// Landing page for the link in the confirmation email. Confirmation
// happens on button press (a POST), so inbox link-prefetching bots
// can't consume the token.

import type { Metadata } from "next";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Confirm your subscription" };

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && /^[0-9a-f]{64}$/.test(token);

  return (
    <main className="w-full max-w-xl mx-auto min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border-soft bg-surface p-8 text-center">
        {valid ? (
          <>
            <h1 className="text-lg font-bold mb-2">Almost there</h1>
            <p className="text-muted text-[15px] mb-6">
              One click confirms your email and unlocks the feed.
            </p>
            <ConfirmButton token={token} />
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold mb-2">Invalid link</h1>
            <p className="text-muted text-[15px]">
              This confirmation link is malformed. Try the link from your
              email again, or re-subscribe to get a fresh one.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
