// Deliverability check: does the email's domain actually accept mail?
// Workers can't do raw DNS, so we ask Cloudflare's DNS-over-HTTPS
// resolver for MX records (falling back to A/AAAA, which mail servers
// may legally use when no MX exists).

import { emailDomain } from "@/lib/domain/email";

const DOH_URL = "https://cloudflare-dns.com/dns-query";

async function hasRecord(domain: string, type: "MX" | "A" | "AAAA"): Promise<boolean> {
  const res = await fetch(
    `${DOH_URL}?name=${encodeURIComponent(domain)}&type=${type}`,
    { headers: { accept: "application/dns-json" } },
  );
  if (!res.ok) throw new Error(`DoH lookup failed: ${res.status}`);
  const data = (await res.json()) as { Answer?: unknown[] };
  return Array.isArray(data.Answer) && data.Answer.length > 0;
}

/**
 * True if the domain looks deliverable. Fails OPEN on resolver outages —
 * a broken DNS lookup shouldn't lock real people out of subscribing;
 * the double opt-in email is the real proof of deliverability anyway.
 */
export async function isDeliverableDomain(email: string): Promise<boolean> {
  const domain = emailDomain(email);
  try {
    if (await hasRecord(domain, "MX")) return true;
    return (await hasRecord(domain, "A")) || (await hasRecord(domain, "AAAA"));
  } catch {
    return true;
  }
}
