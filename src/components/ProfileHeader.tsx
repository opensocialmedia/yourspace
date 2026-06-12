// The always-visible top of the page: header photo, avatar, name, bio,
// links, subscriber count.

import type { Profile } from "@/types";
import { formatCount } from "@/components/format";

export function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <header>
      <div className="h-36 sm:h-48 bg-surface overflow-hidden">
        {profile.headerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.headerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="px-4">
        <div className="-mt-12 sm:-mt-14 mb-3">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-background bg-surface overflow-hidden">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-muted">
                {profile.displayName.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <h1 className="text-xl font-bold">{profile.displayName}</h1>

        {profile.bio && (
          <p className="mt-2 text-[15px] whitespace-pre-wrap">{profile.bio}</p>
        )}

        {profile.links.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {profile.links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline text-[15px]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-[15px] text-muted">
          <span className="font-bold text-foreground">
            {formatCount(profile.subscriberCount)}
          </span>{" "}
          {profile.subscriberCount === 1 ? "Follower" : "Followers"}
        </p>
      </div>
    </header>
  );
}
