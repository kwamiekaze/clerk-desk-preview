import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  generateText,
  parseModelJson,
  resolveActiveProvider,
  SYSTEM_GENERATE,
  SYSTEM_EDIT,
  SYSTEM_CLONE,
  type ChatMessage,
  type ParsedFile,
  type Attachment,
} from "./provider.server";

const FREE_PROJECT_CAP = 10;
const FREE_MONTHLY_GENERATE_CAP = 25;

const AttachmentSchema = z.array(
  z.object({ path: z.string().max(500), url: z.string().max(1200) }),
).max(4).optional();

async function enforceFreePlanLimits(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  action: "generate" | "clone",
) {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
  if (profile?.plan === "pro") return;

  const { count: pc } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((pc ?? 0) >= FREE_PROJECT_CAP) {
    throw new Error(`Free plan is limited to ${FREE_PROJECT_CAP} projects. Upgrade to Pro to build more.`);
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: uc } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("kind", ["generate", "clone"])
    .gte("created_at", since);
  if ((uc ?? 0) >= FREE_MONTHLY_GENERATE_CAP) {
    throw new Error(`Free plan is limited to ${FREE_MONTHLY_GENERATE_CAP} builds per 30 days. Upgrade to Pro for unlimited.`);
  }
  void action;
}

function toAttachments(
  incoming: Array<{ path: string; url: string }> | undefined,
  origin: string,
): Attachment[] {
  if (!incoming || incoming.length === 0) return [];
  return incoming.map((a) => {
    const abs = a.url.startsWith("http") ? a.url : `${origin}${a.url}`;
    return { url: a.url, absoluteUrl: abs };
  });
}

function requestOrigin(): string {
  try {
    const url = process.env.PUBLIC_APP_URL;
    if (url) return url.replace(/\/+$/, "");
  } catch { /* ignore */ }
  return "https://codingclerks.com";
}

async function writeFiles(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  projectId: string,
  files: ParsedFile[],
  replace: boolean,
) {
  if (replace) {
    await supabase.from("project_files").delete().eq("project_id", projectId);
  }
  const rows = files.map((f) => ({ project_id: projectId, path: f.path, content: f.content }));
  const { error } = await supabase.from("project_files").upsert(rows, { onConflict: "project_id,path" });
  if (error) throw new Error("Failed to save project files: " + error.message);
}

// ---------- listProjects ----------
export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("id,title,kind,status,created_at,updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- getProject ----------
export const getProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const [{ data: project, error: pe }, files, messages] = await Promise.all([
      context.supabase
        .from("projects")
        .select("id,title,kind,status,created_at,updated_at,user_id,github_repo")
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("project_files")
        .select("id,path,content,updated_at")
        .eq("project_id", data.id)
        .order("path"),
      context.supabase
        .from("project_messages")
        .select("id,role,content,created_at")
        .eq("project_id", data.id)
        .order("created_at"),
    ]);
    if (pe) throw new Error(pe.message);
    if (!project || project.user_id !== context.userId) throw new Error("Project not found.");
    return {
      project,
      files: files.data ?? [],
      messages: messages.data ?? [],
    };
  });

// ---------- generateProject ----------
export const generateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      prompt: z.string().min(3).max(4000),
      attachments: AttachmentSchema,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    await enforceFreePlanLimits(context.supabase, context.userId, "generate");
    const atts = toAttachments(data.attachments, requestOrigin());

    const raw = await generateText(SYSTEM_GENERATE, [{ role: "user", content: data.prompt }], { attachments: atts });
    const parsed = parseModelJson(raw);

    const { data: proj, error: pe } = await context.supabase
      .from("projects")
      .insert({ user_id: context.userId, title: parsed.title, kind: "generated", status: "ready" })
      .select("id")
      .single();
    if (pe || !proj) throw new Error(pe?.message ?? "Failed to create project.");

    await writeFiles(context.supabase, proj.id, parsed.files, false);
    const userMsg = data.prompt + (atts.length ? `\n\n[attached ${atts.length} image${atts.length > 1 ? "s" : ""}]` : "");
    await context.supabase.from("project_messages").insert([
      { project_id: proj.id, role: "user", content: userMsg },
      { project_id: proj.id, role: "assistant", content: parsed.summary },
    ]);
    await context.supabase.from("usage_events").insert({
      user_id: context.userId,
      project_id: proj.id,
      kind: "generate",
    });

    return { id: proj.id };
  });

// ---------- editProject ----------
export const editProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      instruction: z.string().min(2).max(4000),
      attachments: AttachmentSchema,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { data: proj } = await context.supabase
      .from("projects")
      .select("id,user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!proj || proj.user_id !== context.userId) throw new Error("Project not found.");

    await context.supabase.from("projects").update({ status: "building" }).eq("id", data.id);

    try {
      const { data: files } = await context.supabase
        .from("project_files")
        .select("path,content")
        .eq("project_id", data.id);

      const atts = toAttachments(data.attachments, requestOrigin());
      const context_json = JSON.stringify({ files: files ?? [] });
      const messages: ChatMessage[] = [
        { role: "user", content: "Current project files:\n" + context_json },
        { role: "user", content: "Edit instruction: " + data.instruction },
      ];
      const raw = await generateText(SYSTEM_EDIT, messages, { attachments: atts });
      const parsed = parseModelJson(raw);

      await writeFiles(context.supabase, data.id, parsed.files, true);
      await context.supabase
        .from("projects")
        .update({ status: "ready", title: parsed.title, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      const userMsg = data.instruction + (atts.length ? `\n\n[attached ${atts.length} image${atts.length > 1 ? "s" : ""}]` : "");
      await context.supabase.from("project_messages").insert([
        { project_id: data.id, role: "user", content: userMsg },
        { project_id: data.id, role: "assistant", content: parsed.summary },
      ]);
      await context.supabase.from("usage_events").insert({
        user_id: context.userId,
        project_id: data.id,
        kind: "edit",
      });
      return { ok: true, summary: parsed.summary };
    } catch (err) {
      await context.supabase.from("projects").update({ status: "error" }).eq("id", data.id);
      throw err;
    }
  });

// ---------- cloneProject ----------
async function fetchSiteContent(url: string): Promise<{ url: string; html: string; text: string; title: string }> {
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (fcKey) {
    try {
      const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${fcKey}` },
        body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: true }),
      });
      if (resp.ok) {
        const j = await resp.json();
        const md = j?.data?.markdown ?? "";
        const html = j?.data?.html ?? "";
        const title = j?.data?.metadata?.title ?? url;
        return { url, html: html.slice(0, 40000), text: md.slice(0, 30000), title };
      }
    } catch { /* fall through */ }
  }
  const resp = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 CodingClerksBot" } });
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const html = await resp.text();
  const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000);
  return { url, html: html.slice(0, 40000), text, title: titleMatch?.[1]?.trim() ?? url };
}

export const cloneProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      url: z.string().url().refine((u) => u.startsWith("http://") || u.startsWith("https://"), "Must be http(s) URL"),
      notes: z.string().max(2000).optional(),
      attachments: AttachmentSchema,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    await enforceFreePlanLimits(context.supabase, context.userId, "clone");
    const scraped = await fetchSiteContent(data.url);
    const atts = toAttachments(data.attachments, requestOrigin());

    const raw = await generateText(
      SYSTEM_CLONE,
      [
        {
          role: "user",
          content:
            `Source URL: ${scraped.url}\nPage title: ${scraped.title}\n\nExtracted text content:\n${scraped.text}\n\n${data.notes ? "Additional notes from the user: " + data.notes + "\n\n" : ""}Recreate this site as an original modern static app.`,
        },
      ],
      { attachments: atts },
    );
    const parsed = parseModelJson(raw);

    const { data: proj, error: pe } = await context.supabase
      .from("projects")
      .insert({
        user_id: context.userId,
        title: parsed.title || scraped.title || "Cloned site",
        kind: "cloned",
        status: "ready",
      })
      .select("id")
      .single();
    if (pe || !proj) throw new Error(pe?.message ?? "Failed to create project.");

    await writeFiles(context.supabase, proj.id, parsed.files, false);
    await context.supabase.from("project_messages").insert([
      { project_id: proj.id, role: "user", content: `Clone ${data.url}` + (data.notes ? "\n\n" + data.notes : "") },
      { project_id: proj.id, role: "assistant", content: parsed.summary },
    ]);
    await context.supabase.from("usage_events").insert({
      user_id: context.userId,
      project_id: proj.id,
      kind: "clone",
    });
    return { id: proj.id };
  });

// ---------- renameProject / deleteProject ----------
export const renameProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("projects")
      .update({ title: data.title, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("projects")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- usage / profile ----------
export const getUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [{ count: buildsUsed }, { data: profile }, { count: projectCount }] = await Promise.all([
      context.supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .in("kind", ["generate", "clone"])
        .gte("created_at", since),
      context.supabase.from("profiles").select("plan,role,email,display_name,avatar_url").eq("id", context.userId).maybeSingle(),
      context.supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId),
    ]);
    return {
      buildsUsed: buildsUsed ?? 0,
      buildsCap: FREE_MONTHLY_GENERATE_CAP,
      projectCount: projectCount ?? 0,
      projectCap: FREE_PROJECT_CAP,
      plan: profile?.plan ?? "free",
      role: profile?.role ?? "user",
      email: profile?.email ?? null,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    };
  });

// ---------- admin ----------
export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: prof } = await context.supabase
      .from("profiles")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (prof?.role !== "admin") throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [
      { count: userCount },
      { count: projectCount },
      { count: buildCount },
      { data: recentUsers },
      { data: recentProjects },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("usage_events").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id,email,plan,role,created_at").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("projects").select("id,title,kind,status,user_id,created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    return {
      userCount: userCount ?? 0,
      projectCount: projectCount ?? 0,
      buildCount: buildCount ?? 0,
      recentUsers: recentUsers ?? [],
      recentProjects: recentProjects ?? [],
    };
  });
