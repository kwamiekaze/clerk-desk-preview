import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function readToken(supabase: import("@supabase/supabase-js").SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from("user_secrets").select("github_token").eq("user_id", userId).maybeSingle();
  const token = data?.github_token;
  if (!token) throw new Error("Add a GitHub Personal Access Token in Settings first.");
  return token;
}

const gh = (token: string) => ({
  "Accept": "application/vnd.github+json",
  "Authorization": `Bearer ${token}`,
  "content-type": "application/json",
  "X-GitHub-Api-Version": "2022-11-28",
});

function b64EncodeUtf8(str: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(str, "utf-8").toString("base64");
  // fallback
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function b64DecodeUtf8(str: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(str, "base64").toString("utf-8");
  const bin = atob(str.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export const saveGithubToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ token: z.string().min(20).max(500) }).parse)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_secrets")
      .upsert({ user_id: context.userId, github_token: data.token, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const clearGithubToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("user_secrets").update({ github_token: null }).eq("user_id", context.userId);
    return { ok: true as const };
  });

export const getGithubTokenStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_secrets")
      .select("github_token,updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { hasToken: !!data?.github_token, savedAt: data?.updated_at ?? null };
  });

export const pushProjectToGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ projectId: z.string().uuid(), repoName: z.string().optional() }).parse)
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    if ((profile?.plan ?? "free") !== "pro") throw new Error("GitHub push is a Pro feature.");

    const { data: proj } = await context.supabase
      .from("projects")
      .select("id,title,user_id,github_repo")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!proj || proj.user_id !== context.userId) throw new Error("Project not found.");

    const token = await readToken(context.supabase, context.userId);
    const headers = gh(token);

    const userResp = await fetch("https://api.github.com/user", { headers });
    if (!userResp.ok) throw new Error("Invalid GitHub token.");
    const me = await userResp.json() as { login: string };
    const owner = me.login;
    const repo =
      (data.repoName?.trim() ||
        proj.github_repo?.split("/")[1] ||
        proj.title.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") ||
        "codingclerks-project").slice(0, 90);

    // Create repo (tolerate 422 already-exists)
    const createResp = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: repo, private: false, description: "Built with CodingClerks" }),
    });
    if (!createResp.ok && createResp.status !== 422) {
      throw new Error(`GitHub error: ${createResp.status} ${await createResp.text().catch(() => "")}`);
    }

    const { data: files } = await context.supabase
      .from("project_files")
      .select("path,content")
      .eq("project_id", data.projectId);
    if (!files || files.length === 0) throw new Error("Project has no files.");

    for (const f of files) {
      const filePath = f.path;
      const contentB64 = b64EncodeUtf8(f.content);
      // Get current sha
      let sha: string | undefined;
      const shaResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, { headers });
      if (shaResp.ok) {
        const j = await shaResp.json() as { sha?: string };
        sha = j.sha;
      }
      const putResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: "CodingClerks push", content: contentB64, sha }),
      });
      if (!putResp.ok) {
        throw new Error(`Failed to write ${filePath}: ${putResp.status} ${await putResp.text().catch(() => "")}`);
      }
    }

    const repoUrl = `https://github.com/${owner}/${repo}`;
    await context.supabase.from("projects").update({ github_repo: `${owner}/${repo}` }).eq("id", data.projectId);
    return { ok: true as const, url: repoUrl, repo: `${owner}/${repo}` };
  });

export const pullProjectFromGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ ownerRepo: z.string().regex(/^[^/\s]+\/[^/\s]+$/) }).parse)
  .handler(async ({ data, context }) => {
    const token = await readToken(context.supabase, context.userId);
    const headers = gh(token);
    const [owner, repo] = data.ownerRepo.split("/");

    const treeResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers });
    if (!treeResp.ok) throw new Error("Repo not found or inaccessible.");
    const tree = await treeResp.json() as { tree: Array<{ path: string; type: string; size: number }> };

    const wanted = tree.tree
      .filter((n) => n.type === "blob" && /\.(html|css|js|md)$/i.test(n.path) && n.size < 200 * 1024)
      .slice(0, 20);
    if (wanted.length === 0) throw new Error("No supported files (html/css/js/md under 200KB) found.");

    const files: { path: string; content: string }[] = [];
    for (const node of wanted) {
      const cResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(node.path)}`, { headers });
      if (!cResp.ok) continue;
      const j = await cResp.json() as { content?: string; encoding?: string };
      if (j.encoding !== "base64" || !j.content) continue;
      files.push({ path: node.path, content: b64DecodeUtf8(j.content) });
    }
    if (files.length === 0) throw new Error("Could not read any files from the repo.");
    // Ensure an index.html exists
    if (!files.some((f) => f.path === "index.html")) {
      const first = files.find((f) => f.path.endsWith(".html")) || files[0];
      first.path = "index.html";
    }

    const { data: newProj, error } = await context.supabase
      .from("projects")
      .insert({ user_id: context.userId, title: repo, kind: "generated", status: "ready", github_repo: `${owner}/${repo}` })
      .select("id")
      .single();
    if (error || !newProj) throw new Error(error?.message ?? "Failed to create project.");

    const rows = files.map((f) => ({ project_id: newProj.id, path: f.path, content: f.content }));
    await context.supabase.from("project_files").insert(rows);
    await context.supabase.from("project_messages").insert([
      { project_id: newProj.id, role: "user", content: `Pull ${owner}/${repo}` },
      { project_id: newProj.id, role: "assistant", content: `Imported ${files.length} files from ${owner}/${repo}.` },
    ]);
    await context.supabase.from("usage_events").insert({ user_id: context.userId, project_id: newProj.id, kind: "generate" });

    return { id: newProj.id };
  });
