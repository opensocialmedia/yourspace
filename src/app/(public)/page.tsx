// The main feed page. Server-rendered: post content is only fetched and
// sent when the request carries a valid confirmed-subscriber session —
// non-subscribers get the follow gate and zero post data.

import type { Metadata } from "next";
import type { FeedTab } from "@/types";
import { getConfig } from "@/lib/config";
import { getSubscriberId } from "@/lib/services/session.service";
import * as profileService from "@/lib/services/profile.service";
import * as postService from "@/lib/services/post.service";
import { ProfileHeader } from "@/components/ProfileHeader";
import { FeedTabs } from "@/components/FeedTabs";
import { PostCard } from "@/components/PostCard";
import { FollowGate } from "@/components/FollowGate";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await profileService.getProfile();
  return {
    title: profile.displayName,
    description: profile.bio || `Follow ${profile.displayName}`,
    openGraph: {
      title: profile.displayName,
      description: profile.bio || `Follow ${profile.displayName}`,
    },
  };
}

const VALID_TABS: FeedTab[] = ["all", "videos", "photos", "media"];

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab: FeedTab = VALID_TABS.includes(rawTab as FeedTab)
    ? (rawTab as FeedTab)
    : "all";

  const [profile, subscriberId] = await Promise.all([
    profileService.getProfile(),
    getSubscriberId(),
  ]);

  return (
    <main className="w-full max-w-xl mx-auto border-x border-border-soft min-h-screen">
      <ProfileHeader profile={profile} />

      {subscriberId ? (
        <SubscribedFeed subscriberId={subscriberId} tab={tab} profile={profile} />
      ) : (
        <GatedFeed profile={profile} />
      )}
    </main>
  );
}

async function SubscribedFeed({
  subscriberId,
  tab,
  profile,
}: {
  subscriberId: string;
  tab: FeedTab;
  profile: Awaited<ReturnType<typeof profileService.getProfile>>;
}) {
  const posts = await postService.getFeed(subscriberId, tab);
  return (
    <>
      <FeedTabs active={tab} />
      {posts.length === 0 ? (
        <p className="p-8 text-center text-muted">Nothing here yet.</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            authorName={profile.displayName}
            avatarUrl={profile.avatarUrl}
          />
        ))
      )}
    </>
  );
}

async function GatedFeed({
  profile,
}: {
  profile: Awaited<ReturnType<typeof profileService.getProfile>>;
}) {
  const [{ turnstileSiteKey }, postCount] = await Promise.all([
    getConfig(),
    postService.getPublishedCount(),
  ]);
  return (
    <FollowGate
      postCount={postCount}
      turnstileSiteKey={turnstileSiteKey}
      displayName={profile.displayName}
    />
  );
}
