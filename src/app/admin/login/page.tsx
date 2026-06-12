// /admin/login — the only admin page reachable without a session.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/services/session.service";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <AdminLoginForm />
    </main>
  );
}
