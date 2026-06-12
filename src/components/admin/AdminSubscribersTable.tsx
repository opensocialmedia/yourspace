"use client";

import { useRouter } from "next/navigation";
import type { Subscriber } from "@/types";
import { apiFetch } from "@/hooks/use-api";

export function AdminSubscribersTable({
  subscribers,
}: {
  subscribers: Subscriber[];
}) {
  const router = useRouter();
  const confirmed = subscribers.filter((s) => s.status === "confirmed").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">
          Subscribers — {confirmed} confirmed, {subscribers.length - confirmed}{" "}
          pending
        </h2>
        {/* Plain <a>: this is a CSV file download, not a page navigation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/subscribers/export"
          className="rounded-full border border-border-soft px-4 py-1.5 text-[13px] text-muted hover:bg-surface transition-colors"
        >
          Export CSV ↓
        </a>
      </div>

      {subscribers.length === 0 ? (
        <p className="text-muted text-[14px]">Nobody yet — share your site!</p>
      ) : (
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="text-muted text-[13px] border-b border-border-soft">
              <th className="py-2 font-normal">Email</th>
              <th className="py-2 font-normal">Status</th>
              <th className="py-2 font-normal">Signed up</th>
              <th className="py-2 font-normal" />
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-border-soft">
                <td className="py-2.5 pr-3 break-all">{s.email}</td>
                <td className="py-2.5 pr-3">
                  <span
                    className={
                      s.status === "confirmed"
                        ? "text-green-400"
                        : "text-yellow-500"
                    }
                  >
                    {s.status}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-muted">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={async () => {
                      if (confirm(`Remove ${s.email}? They lose access immediately.`)) {
                        await apiFetch(`/api/admin/subscribers/${s.id}`, {
                          method: "DELETE",
                        });
                        router.refresh();
                      }
                    }}
                    className="text-[13px] text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
