// Pure email business rules (no network calls — the MX lookup that
// checks deliverability lives in services/email-verification).

// Pragmatic RFC-5322-ish check: one @, no spaces, a dot in the domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmailFormat(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1);
}
