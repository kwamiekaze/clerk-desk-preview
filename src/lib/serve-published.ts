import { RESERVED_SLUGS } from "./reserved-slugs";

export function contentTypeFor(path: string): string {
  if (path.endsWith(".html") || !path.includes(".")) return "text/html; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (path.endsWith(".json")) return "application/json; charset=utf-8";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "text/plain; charset=utf-8";
}

export function notFoundHtml(slug: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Not found — CodingClerks</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  html,body{margin:0;height:100%;background:#030805;color:#c8ffdd;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .wrap{min-height:100%;display:grid;place-items:center;text-align:center;padding:24px}
  h1{font-size:88px;margin:0;color:#00FF41;text-shadow:0 0 20px rgba(0,255,65,.6)}
  p{color:#7cffb0;opacity:.8}
  a{color:#00FF41;text-decoration:none;border-bottom:1px dashed #00FF41}
  </style></head><body><div class="wrap"><div>
  <h1>404</h1><p>No site is published at <code>/${slug}</code>.</p>
  <p><a href="https://codingclerks.com">codingclerks.com</a></p>
  </div></div></body></html>`;
}

export async function serveSlugPath(slug: string, path: string): Promise<Response> {
  if (RESERVED_SLUGS.has(slug)) {
    return new Response(notFoundHtml(slug), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: site } = await supabaseAdmin
    .from("published_sites")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!site) {
    return new Response(notFoundHtml(slug), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  }
  const { data: file } = await supabaseAdmin
    .from("published_files")
    .select("content")
    .eq("site_id", site.id)
    .eq("path", path)
    .maybeSingle();
  if (!file) {
    // fall back to index.html only when the request was for a bare directory path
    if (path === "index.html") {
      return new Response(notFoundHtml(slug), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return new Response(notFoundHtml(slug), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  }
  return new Response(file.content, {
    status: 200,
    headers: {
      "content-type": contentTypeFor(path),
      "cache-control": "public, max-age=60",
    },
  });
}

/**
 * Custom-domain serving. When the incoming Host isn't the app's own host and matches
 * an active custom_domains row, serve that project's published files for any path.
 * Returns null so normal app routing continues for every other Host.
 */
export async function serveCustomDomainRequest(request: Request): Promise<Response | null> {
  let host = "";
  try {
    host = new URL(request.url).host.toLowerCase();
  } catch {
    return null;
  }
  if (!host) return null;

  const raw = process.env.PUBLIC_APP_URL || "https://codingclerks.com";
  let appHost = "codingclerks.com";
  try { appHost = new URL(raw).host.toLowerCase(); } catch { /* keep default */ }

  const bare = host.replace(/:\d+$/, "");
  if (bare === appHost.replace(/:\d+$/, "")) return null;
  if (bare === "localhost" || bare.endsWith(".lovable.app") || bare.endsWith(".lovableproject.com")) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: domain } = await supabaseAdmin
    .from("custom_domains")
    .select("project_id")
    .eq("domain", bare)
    .eq("status", "active")
    .maybeSingle();
  if (!domain) return null;

  const { data: site } = await supabaseAdmin
    .from("published_sites")
    .select("id,slug")
    .eq("project_id", domain.project_id)
    .maybeSingle();
  if (!site) return null;

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/+/, "").replace(/\.\./g, "") || "index.html";

  const { data: file } = await supabaseAdmin
    .from("published_files")
    .select("content")
    .eq("site_id", site.id)
    .eq("path", path)
    .maybeSingle();

  if (!file) {
    if (path === "index.html") return new Response(notFoundHtml(site.slug), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
    // SPA-ish fallback: serve the entry page for unknown paths.
    const { data: index } = await supabaseAdmin
      .from("published_files")
      .select("content")
      .eq("site_id", site.id)
      .eq("path", "index.html")
      .maybeSingle();
    if (!index) return new Response(notFoundHtml(site.slug), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response(index.content, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" } });
  }

  return new Response(file.content, {
    status: 200,
    headers: { "content-type": contentTypeFor(path), "cache-control": "public, max-age=60" },
  });
}
