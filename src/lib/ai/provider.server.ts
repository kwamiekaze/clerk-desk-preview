// Server-only AI provider layer. Raw fetch, no SDKs.
// Selects provider from AI_PROVIDER env; each provider reads its own key.

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Attachment = { url: string; absoluteUrl?: string; mime?: string };

function envKey(provider: string): { keyName: string; key: string | undefined } {
  switch (provider) {
    case "anthropic":
      return { keyName: "ANTHROPIC_API_KEY", key: process.env.ANTHROPIC_API_KEY };
    case "openai":
      return { keyName: "OPENAI_API_KEY", key: process.env.OPENAI_API_KEY };
    case "openrouter":
      return { keyName: "OPENROUTER_API_KEY", key: process.env.OPENROUTER_API_KEY };
    case "gemini":
      return { keyName: "GEMINI_API_KEY", key: process.env.GEMINI_API_KEY };
    default:
      return { keyName: "ANTHROPIC_API_KEY", key: undefined };
  }
}

async function readError(resp: Response): Promise<string> {
  let body = "";
  try { body = await resp.text(); } catch { /* ignore */ }
  return `Provider error ${resp.status}: ${body.slice(0, 400)}`;
}

async function fetchImageBase64(url: string): Promise<{ b64: string; mime: string } | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const mime = r.headers.get("content-type") || "image/png";
    const buf = new Uint8Array(await r.arrayBuffer());
    const b64 = typeof Buffer !== "undefined"
      ? Buffer.from(buf).toString("base64")
      : (() => { let s = ""; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]); return btoa(s); })();
    return { b64, mime };
  } catch { return null; }
}

export async function generateText(
  system: string,
  messages: ChatMessage[],
  opts?: { attachments?: Attachment[] },
): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  const { keyName, key } = envKey(provider);
  if (!key) {
    throw new Error(
      `AI provider "${provider}" selected but ${keyName} is not set. Add it in Project Settings → Secrets.`,
    );
  }
  const model = process.env.AI_MODEL;
  const atts = opts?.attachments ?? [];

  if (provider === "anthropic") {
    const anthMsgs: Array<{ role: "user" | "assistant"; content: unknown }> = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    if (atts.length > 0 && anthMsgs.length > 0) {
      const last = anthMsgs[anthMsgs.length - 1];
      const blocks: Array<Record<string, unknown>> = [{ type: "text", text: String(last.content) }];
      for (const a of atts) {
        const src = a.absoluteUrl || a.url;
        const img = await fetchImageBase64(src);
        if (img) {
          blocks.push({
            type: "image",
            source: { type: "base64", media_type: img.mime, data: img.b64 },
          });
        }
      }
      blocks.push({
        type: "text",
        text: "You may embed the provided image URLs directly in <img src> in the generated site: " +
          atts.map((a) => a.absoluteUrl || a.url).join(" , "),
      });
      last.content = blocks;
    }
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-5",
        max_tokens: 16000,
        system,
        messages: anthMsgs,
      }),
    });
    if (!resp.ok) throw new Error(await readError(resp));
    const j = await resp.json();
    return (j.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
  }

  const augmented = messages.slice();
  if (atts.length > 0 && augmented.length > 0) {
    const last = augmented[augmented.length - 1];
    const lines = atts.map((a) => `REFERENCE IMAGE (may be embedded in the site): ${a.absoluteUrl || a.url}`).join("\n");
    augmented[augmented.length - 1] = { ...last, content: last.content + "\n\n" + lines };
  }

  if (provider === "openai" || provider === "openrouter") {
    const url =
      provider === "openai"
        ? "https://api.openai.com/v1/chat/completions"
        : "https://openrouter.ai/api/v1/chat/completions";
    const defaultModel = provider === "openai" ? "gpt-4o" : "openrouter/auto";
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model || defaultModel,
        max_tokens: 16000,
        messages: [{ role: "system", content: system }, ...augmented],
      }),
    });
    if (!resp.ok) throw new Error(await readError(resp));
    const j = await resp.json();
    return j.choices?.[0]?.message?.content ?? "";
  }

  if (provider === "gemini") {
    const m = model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: augmented.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 16000 },
      }),
    });
    if (!resp.ok) throw new Error(await readError(resp));
    const j = await resp.json();
    return (j.candidates?.[0]?.content?.parts || [])
      .map((p: { text?: string }) => p.text || "")
      .join("");
  }

  throw new Error(`Unknown AI_PROVIDER "${provider}"`);
}

// ---- Tolerant JSON parser + file sanitization ----

export type ParsedFile = { path: string; content: string };
export type ParsedResult = { title: string; summary: string; files: ParsedFile[] };

export function parseModelJson(raw: string): ParsedResult {
  let text = raw.trim();
  // strip triple-backtick fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first < 0 || last < 0) throw new Error("Model output did not contain a JSON object.");
  const slice = text.slice(first, last + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(slice);
  } catch (e) {
    throw new Error("Model output was not valid JSON: " + (e as Error).message);
  }
  const obj = parsed as { title?: unknown; summary?: unknown; files?: unknown };
  const filesIn = Array.isArray(obj.files) ? obj.files : [];
  if (filesIn.length === 0) throw new Error("Model did not return any files.");
  const files: ParsedFile[] = [];
  for (const f of filesIn) {
    const fo = f as { path?: unknown; content?: unknown };
    if (typeof fo.path !== "string" || typeof fo.content !== "string") continue;
    let path = fo.path.replace(/^\/+/, "").replace(/\.\./g, "").slice(0, 200);
    if (!path) continue;
    files.push({ path, content: fo.content });
  }
  if (files.length === 0) throw new Error("Model returned files but none were usable.");
  if (!files.some((f) => f.path === "index.html")) {
    files[0] = { path: "index.html", content: files[0].content };
  }
  return {
    title: typeof obj.title === "string" ? obj.title : "Untitled project",
    summary: typeof obj.summary === "string" ? obj.summary : "Project generated.",
    files,
  };
}

// ---- Shared system prompts ----

const OUTPUT_CONTRACT = `

OUTPUT FORMAT — follow exactly:
Respond with ONLY a JSON object, no markdown fences, no commentary:
{ "title": "short project title", "summary": "2-3 sentences describing what you built or changed, written to the user", "files": [{ "path": "index.html", "content": "<full file content>" }] }

TECHNICAL RULES for every file:
- Build a self-contained static web app. "index.html" is required and is the entry page.
- Style with Tailwind via CDN: include <script src="https://cdn.tailwindcss.com"></script> in each page's <head>.
- Interactivity: prefer vanilla JS in a <script> tag. If the app truly needs React, load React 18 UMD + Babel Standalone from a CDN and write JSX inside <script type="text/babel">.
- No build steps, no npm imports, no local asset files. Images: inline SVG or https://placehold.co URLs.
- Multiple pages are allowed (e.g. "about.html") with relative links between them. Keep it to at most 4 files.
- Every page must be responsive, polished, and complete — real copy, no lorem ipsum, no TODO comments, no broken references.
- Keep total output under roughly 1200 lines so nothing is cut off. One excellent page beats four thin ones.
`;

export const SYSTEM_GENERATE =
  "You are the build engine for CodingClerks, an AI app builder. A user will describe a website or app. Design and produce it at the quality bar of a senior product designer and front-end engineer: intentional palette, strong typography, real content inferred from the request, responsive layout." +
  OUTPUT_CONTRACT;

export const SYSTEM_EDIT =
  "You are the build engine for CodingClerks. You will receive the COMPLETE current files of a user's project as JSON, followed by an edit instruction. Apply the instruction to the existing design — do not restart from scratch, preserve everything the user did not ask to change. Return the COMPLETE updated project: include EVERY file with FULL content, even files you did not modify. Files you omit will be deleted." +
  OUTPUT_CONTRACT;

export const SYSTEM_CLONE =
  "You are the build engine for CodingClerks. You will receive scraped content and metadata from a real website. Recreate it as a modern, original static web app: preserve the information architecture, page structure, headings, and text content, but implement a fresh, cleaner visual design. Do not attempt to copy proprietary logos or images — use inline SVG placeholders or https://placehold.co with descriptive labels instead." +
  OUTPUT_CONTRACT;
