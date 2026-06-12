// Business rules for comment usernames.

import {
  USERNAME_ADJECTIVES,
  USERNAME_NOUNS,
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
} from "@/lib/constants";

/** "CosmicWalrus42" — random adjective + noun + 2-digit number. */
export function generateUsername(): string {
  const rand = crypto.getRandomValues(new Uint32Array(3));
  const adjective = USERNAME_ADJECTIVES[rand[0] % USERNAME_ADJECTIVES.length];
  const noun = USERNAME_NOUNS[rand[1] % USERNAME_NOUNS.length];
  const number = (rand[2] % 90) + 10; // 10–99
  return `${adjective}${noun}${number}`;
}

/**
 * A self-chosen username: letters, numbers, underscores and hyphens only,
 * within length limits. Returns a cleaned value or an error message.
 */
export function validateChosenUsername(
  raw: string,
): { ok: true; username: string } | { ok: false; reason: string } {
  const username = raw.trim();
  if (username.length < MIN_USERNAME_LENGTH) {
    return { ok: false, reason: `Username must be at least ${MIN_USERNAME_LENGTH} characters` };
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return { ok: false, reason: `Username must be at most ${MAX_USERNAME_LENGTH} characters` };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { ok: false, reason: "Username can only contain letters, numbers, _ and -" };
  }
  return { ok: true, username };
}
