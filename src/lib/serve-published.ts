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
