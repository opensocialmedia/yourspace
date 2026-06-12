// The owner profile shown at the top of the page.

import type { Profile } from "@/types";
import { getConfig } from "@/lib/config";
import * as profileRepo from "@/lib/repositories/profile.repo";
import * as subscribersRepo from "@/lib/repositories/subscribers.repo";

export async function getProfile(): Promise<Profile> {
  const { db } = await getConfig();
  const [row, links, subscriberCount] = await Promise.all([
    profileRepo.getProfile(db),
    profileRepo.getLinks(db),
    subscribersRepo.countConfirmed(db),
  ]);
  return {
    displayName: row?.display_name ?? "Your Name",
    bio: row?.bio ?? "",
    avatarUrl: row?.avatar_key ? `/api/media/${row.avatar_key}` : null,
    headerUrl: row?.header_key ? `/api/media/${row.header_key}` : null,
    links: links.map((l) => ({
      id: l.id,
      label: l.label,
      url: l.url,
      sortOrder: l.sort_order,
    })),
    subscriberCount,
  };
}

export async function updateProfile(data: {
  displayName: string;
  bio: string;
  links: { label: string; url: string }[];
}): Promise<void> {
  const { db } = await getConfig();
  await profileRepo.updateProfile(db, {
    displayName: data.displayName,
    bio: data.bio,
  });
  await profileRepo.replaceLinks(db, data.links);
}
