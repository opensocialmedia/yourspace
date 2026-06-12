// /admin/profile — edit everything visitors see at the top of the page.

import type { Metadata } from "next";
import * as profileService from "@/lib/services/profile.service";
import { AdminProfileForm } from "@/components/admin/AdminProfileForm";

export const metadata: Metadata = {
  title: "Admin · Profile",
  robots: { index: false, follow: false },
};

export default async function AdminProfilePage() {
  const profile = await profileService.getProfile();
  return <AdminProfileForm profile={profile} />;
}
