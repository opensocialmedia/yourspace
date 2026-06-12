// /admin/subscribers — the email list: view, delete, export CSV.

import type { Metadata } from "next";
import * as subscriberService from "@/lib/services/subscriber.service";
import { AdminSubscribersTable } from "@/components/admin/AdminSubscribersTable";

export const metadata: Metadata = {
  title: "Admin · Subscribers",
  robots: { index: false, follow: false },
};

export default async function AdminSubscribersPage() {
  const subscribers = await subscriberService.listSubscribers();
  return <AdminSubscribersTable subscribers={subscribers} />;
}
