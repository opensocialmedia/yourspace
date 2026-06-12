// Shared TypeScript definitions used across the whole app.

export type PostType = "text" | "image" | "video" | "link";

/** A post as the UI consumes it (counts included, R2 keys resolved to URLs). */
export interface Post {
  id: string;
  type: PostType;
  body: string;
  mediaUrl: string | null;
  mediaContentType: string | null;
  linkUrl: string | null;
  linkTitle: string | null;
  linkDescription: string | null;
  linkImageUrl: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  /** The signed-in subscriber's own reaction, if any. */
  viewerReaction: "like" | "dislike" | null;
}

export interface Comment {
  id: string;
  postId: string;
  username: string;
  body: string;
  createdAt: string;
}

export type SubscriberStatus = "pending" | "confirmed";

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  username: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export interface ProfileLink {
  id: number;
  label: string;
  url: string;
  sortOrder: number;
}

export interface Profile {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  headerUrl: string | null;
  links: ProfileLink[];
  subscriberCount: number;
}

/** What the feed page knows about the current visitor. */
export interface Viewer {
  subscriberId: string | null;
  isSubscribed: boolean;
}

export type FeedTab = "all" | "videos" | "photos" | "media";
