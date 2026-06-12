// Tab selector above the feed: All Posts / Videos / Photos / Media.
// Pure links — the page re-renders server-side with the right filter.

import Link from "next/link";
import type { FeedTab } from "@/types";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "all", label: "All Posts" },
  { id: "videos", label: "Videos" },
  { id: "photos", label: "Photos" },
  { id: "media", label: "Media" },
];

export function FeedTabs({ active }: { active: FeedTab }) {
  return (
    <nav className="mt-4 flex border-b border-border-soft">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.id === "all" ? "/" : `/?tab=${tab.id}`}
          className={`flex-1 text-center py-3.5 text-[15px] transition-colors hover:bg-surface ${
            active === tab.id
              ? "font-bold border-b-[3px] border-accent"
              : "text-muted"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
