"use client";

import { useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/use-api";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await apiFetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      className="rounded-full border border-border-soft px-4 py-1.5 text-[14px] text-muted hover:bg-surface transition-colors"
    >
      Log out
    </button>
  );
}
