// The shareable single-post page. Anyone hitting a shared link lands
// here: crawlers get OG/Twitter preview tags (site branding + a short
// teaser), subscribers see the full post, everyone else gets the gate.

import type { Metadata } from "next";
import Link from "next/link";
import { getConfig } from "@/lib/config";
import { getSubscriberId } from "@/lib/services/session.service";
import * as profileService from "@/lib/services/profile.service";
import * as postService from "@/lib/services/post.service";
import { ProfileHeader } from "@/components/ProfileHeader";
import { PostCard } from "@/components/PostCard";
import { FollowGate } from "@/components/FollowGate";

export const dynamic = "force-dynamic";

// How much of a post leaks into the share preview. Keep it short — the
// full content stays behind the follow gate.
const TEASER_LENGTH = 120;

function teaserFor(body: string, linkTitle: string | null): string {
  const source = body || linkTitle || "";
  if (!source) return "Follow to see this post.";
  return source.length > TEASER_LENGTH
    ? `${source.slice(0, TEASER_LENGTH)}…`
    : source;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await profileService.getProfile();

  let description = "Follow to see this post.";
  try {
    const post = await postService.getPost(id, null);
    description = teaserFor(post.body, post.linkTitle);
  } catch {
    // Missing post still renders branded metadata.
  }

  const { siteUrl } = await getConfig();
  const title = `${profile.displayName} on ${new URL(siteUrl).hostname}`;
  const images = profile.headerUrl
    ? [`${siteUrl}${profile.headerUrl}`]
    : profile.avatarUrl
      ? [`${siteUrl}${profile.avatarUrl}`]
      : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/post/${id}`,
      type: "article",
      images,
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, subscriberId] = await Promise.all([
    profileService.getProfile(),
    getSubscriberId(),
  ]);

  let content: React.ReactNode;
  if (!subscriberId) {
    const { turnstileSiteKey } = await getConfig();
    content = (
      <FollowGate
        postCount={1}
        turnstileSiteKey={turnstileSiteKey}
        displayName={profile.displayName}
      />
    );
  } else {
    const post = await postService.getPost(id, subscriberId).catch(() => null);
    content = post ? (
      <PostCard
        post={post}
        authorName={profile.displayName}
        avatarUrl={profile.avatarUrl}
      />
    ) : (
      <p className="p-8 text-center text-muted">
        This post doesn&apos;t exist (anymore).
      </p>
    );
  }

  return (
    <main className="w-full max-w-xl mx-auto border-x border-border-soft min-h-screen">
      <ProfileHeader profile={profile} />
      <div className="border-t border-border-soft mt-4">
        <Link
          href="/"
          className="block px-4 py-3 text-accent text-[14px] hover:underline"
        >
          ← Back to the feed
        </Link>
        {content}
      </div>
    </main>
  );
}
