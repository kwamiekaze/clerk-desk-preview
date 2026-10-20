export const RESERVED_SLUGS = new Set([
  "app", "auth", "api", "admin", "login", "signup", "settings", "profile",
  "p", "u", "assets", "static", "pricing", "terms", "privacy",
  "favicon.ico", "robots.txt", "sitemap.xml", "reset-password",
  "billing", "checkout", "public", "docs", "sonnygames",
]);

export const SLUG_REGEX = /^[a-z0-9-]{3,40}$/;

export function isValidSlug(slug: string): { ok: boolean; reason?: string } {
  if (!SLUG_REGEX.test(slug)) return { ok: false, reason: "3–40 chars, lowercase letters, digits, or hyphens." };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: "That slug is reserved." };
  if (slug.startsWith("-") || slug.endsWith("-")) return { ok: false, reason: "Cannot start or end with a hyphen." };
  return { ok: true };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
