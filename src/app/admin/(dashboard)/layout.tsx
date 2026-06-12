// Every page in this group is admin-only: no session → bounced to the
// login page before anything renders. API routes re-check on every
// call, so this layout is UX, and the API checks are the real lock.

import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/services/session.service";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Posts" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/profile", label: "Profile" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4">
      <header className="flex items-center justify-between py-4 border-b border-border-soft">
        <nav className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-1.5 text-[14px] hover:bg-surface transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[14px] text-muted hover:underline">
            View site ↗
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="py-6">{children}</main>
    </div>
  );
}
