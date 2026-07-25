import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { isValidSlug, slugify } from "@/lib/reserved-slugs";

function badgeHtml(): string {
  return `\n<!-- CodingClerks badge -->\n<a href="https://codingclerks.com" target="_blank" rel="noopener" style="position:fixed;bottom:12px;right:12px;z-index:2147483000;font:500 11px/1.4 ui-sans-serif,system-ui,sans-serif;color:#030805;background:#00FF41;padding:6px 10px;border-radius:9999px;text-decoration:none;box-shadow:0 6px 24px rgba(0,255,65,.35);letter-spacing:.02em">Built with CodingClerks</a>\n`;
}

function withBadge(path: string, content: string, addBadge: boolean): string {
  if (!addBadge) return content;
  if (!path.endsWith(".html") && path !== "index.html") return content;
  if (/<\/body>/i.test(content)) return content.replace(/<\/body>/i, badgeHtml() + "</body>");
  return content + badgeHtml();
}

export const checkSlugAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string() }).parse)
  .handler(async ({ data, context }) => {
    const v = isValidSlug(data.slug);
    if (!v.ok) return { ok: false as const, reason: v.reason ?? "Invalid slug." };
    const { data: existing } = await context.supabase
      .from("published_sites")
      .select("id,user_id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (existing && existing.user_id !== context.userId) {
      return { ok: false as const, reason: "That slug is already taken." };
    }
    return { ok: true as const };
  });

export const suggestSlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ title: z.string() }).parse)
  .handler(async ({ data }) => {
    let base = slugify(data.title || "site");
    if (base.length < 3) base = "site-" + base;
    return { slug: base };
  });

export const publishProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ projectId: z.string().uuid(), slug: z.string() }).parse)
  .handler(async ({ data, context }) => {
    const v = isValidSlug(data.slug);
    if (!v.ok) throw new Error(v.reason ?? "Invalid slug.");

    // Ownership check
    const { data: proj } = await context.supabase
      .from("projects")
      .select("id,user_id,title")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!proj || proj.user_id !== context.userId) throw new Error("Project not found.");

    // Slug availability (allow same user's existing site)
    const { data: existingSlug } = await context.supabase
      .from("published_sites")
      .select("id,user_id,project_id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (existingSlug && existingSlug.project_id !== data.projectId) {
      throw new Error("That slug is already taken.");
    }

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    const addBadge = (profile?.plan ?? "free") !== "pro";

    // Fetch files
    const { data: files } = await context.supabase
      .from("project_files")
      .select("path,content")
      .eq("project_id", data.projectId);
    if (!files || files.length === 0) throw new Error("Project has no files to publish.");

    // Upsert site row (owned by caller — RLS-compatible)
    const { data: siteRow, error: siteErr } = await context.supabase
      .from("published_sites")
      .upsert(
        {
          project_id: data.projectId,
          user_id: context.userId,
          slug: data.slug,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" },
      )
      .select("id")
      .single();
    if (siteErr || !siteRow) throw new Error(siteErr?.message ?? "Failed to publish.");

    // Replace files snapshot
    await context.supabase.from("published_files").delete().eq("site_id", siteRow.id);
    const rows = files.map((f: { path: string; content: string }) => ({
      site_id: siteRow.id,
      path: f.path,
      content: withBadge(f.path, f.content, addBadge),
    }));
    const { error: fErr } = await context.supabase.from("published_files").insert(rows);
    if (fErr) throw new Error(fErr.message);

    return { ok: true as const, slug: data.slug, siteId: siteRow.id };
  });

export const unpublishProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ projectId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("published_sites")
      .delete()
      .eq("project_id", data.projectId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getProjectPublishState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ projectId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("published_sites")
      .select("slug,published_at,updated_at")
      .eq("project_id", data.projectId)
      .eq("user_id", context.userId)
      .maybeSingle();
    return { site: row ?? null };
  });

export const listMyPublishedSites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("published_sites")
      .select("id,slug,project_id,updated_at, projects!inner(title)")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{ id: string; slug: string; project_id: string; updated_at: string; projects: { title: string } }>;
  });
