"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/hooks/use-api";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-2xl border border-border-soft bg-surface p-8"
    >
      <h1 className="text-lg font-bold mb-4">Admin</h1>
      <input
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-full border border-border-soft bg-background px-4 py-2.5 text-[15px] outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={busy || !password}
        className="mt-3 w-full rounded-full bg-accent py-2.5 font-bold text-white disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {error && <p className="mt-3 text-[14px] text-red-400">{error}</p>}
    </form>
  );
}
