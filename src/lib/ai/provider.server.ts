// Server-only AI provider layer. Raw fetch, no SDKs.
// BYOK-first: reads the caller's stored provider key; falls back to platform env only when configured.

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Attachment = { url: string; absoluteUrl?: string; mime?: string };
export type ProviderId =
  | "anthropic"
  | "openai"
  | "openrouter"
  | "gemini"
  | "kimi"
  | "glm"
  | "qwen"
  | "deepseek";

export const PROVIDERS: ProviderId[] = [
  "openrouter",
  "openai",
  "anthropic",
  "gemini",
  "kimi",
  "glm",
  "qwen",
  "deepseek",
];

export const PROVIDER_DEFAULT_MODEL: Record<ProviderId, string> = {
  anthropic: "claude-sonnet-4-5",
  openai: "gpt-4o",
  openrouter: "openrouter/auto",
  gemini: "gemini-2.0-flash",
  kimi: "kimi-k3",
  glm: "glm-4.6",
  qwen: "qwen-plus",
  deepseek: "deepseek-v4-flash",
};

export const PROVIDER_LABEL: Record<ProviderId, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  kimi: "Kimi (Moonshot AI)",
  glm: "GLM (Zhipu AI)",
  qwen: "Qwen (Alibaba)",
  deepseek: "DeepSeek",
};

// OpenAI-compatible chat/completions endpoints, per provider.
const OPENAI_COMPATIBLE_URL: Partial<Record<ProviderId, string>> = {
  openai: "https://api.openai.com/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  kimi: "https://api.moonshot.ai/v1/chat/completions",
  // Zhipu/Z.ai: the path already ends in /v4 — appending /v1 404s here.
  glm: "https://api.z.ai/api/paas/v4/chat/completions",
  qwen: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
  deepseek: "https://api.deepseek.com/chat/completions",
};

function envKey(provider: ProviderId): { keyName: string; key: string | undefined } {
  switch (provider) {
    case "anthropic":
      return { keyName: "ANTHROPIC_API_KEY", key: process.env.ANTHROPIC_API_KEY };
    case "openai":
      return { keyName: "OPENAI_API_KEY", key: process.env.OPENAI_API_KEY };
    case "openrouter":
      return { keyName: "OPENROUTER_API_KEY", key: process.env.OPENROUTER_API_KEY };
    case "gemini":
      return { keyName: "GEMINI_API_KEY", key: process.env.GEMINI_API_KEY };
    case "kimi":
      return { keyName: "KIMI_API_KEY", key: process.env.KIMI_API_KEY };
    case "glm":
      return { keyName: "GLM_API_KEY", key: process.env.GLM_API_KEY };
    case "qwen":
      return { keyName: "QWEN_API_KEY", key: process.env.QWEN_API_KEY };
    case "deepseek":
      return { keyName: "DEEPSEEK_API_KEY", key: process.env.DEEPSEEK_API_KEY };
  }
}


export function platformFallbackAvailable(): boolean {
  const p = (process.env.AI_PROVIDER || "").toLowerCase() as ProviderId;
  if (!PROVIDERS.includes(p)) return false;
  return Boolean(envKey(p).key);
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

export type ProviderResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export async function callProvider(
  provider: ProviderId,
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[],
  opts?: { attachments?: Attachment[]; maxTokens?: number },
): Promise<ProviderResult> {
  const atts = opts?.attachments ?? [];
  // Raise ceilings for providers that comfortably handle it; keep others at 16k.
  const defaultMax =
    provider === "anthropic" || provider === "openrouter" || provider === "kimi" ? 24000 : 16000;
  const maxTokens = opts?.maxTokens ?? defaultMax;

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
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || PROVIDER_DEFAULT_MODEL.anthropic,
        max_tokens: maxTokens,
        system,
        messages: anthMsgs,
      }),
    });
    if (!resp.ok) throw new Error(await readError(resp));
    const j = await resp.json();
    return {
      text: (j.content || [])
        .filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join(""),
      inputTokens: num(j?.usage?.input_tokens),
      outputTokens: num(j?.usage?.output_tokens),
    };
  }

  const augmented = messages.slice();
  if (atts.length > 0 && augmented.length > 0) {
    const last = augmented[augmented.length - 1];
    const lines = atts.map((a) => `REFERENCE IMAGE (may be embedded in the site): ${a.absoluteUrl || a.url}`).join("\n");
    augmented[augmented.length - 1] = { ...last, content: last.content + "\n\n" + lines };
  }

  const compatUrl = OPENAI_COMPATIBLE_URL[provider];
  if (compatUrl) {
    const resp = await fetch(compatUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || PROVIDER_DEFAULT_MODEL[provider],
        max_tokens: maxTokens,
        messages: [{ role: "system", content: system }, ...augmented],
      }),
    });
    if (!resp.ok) throw new Error(await readError(resp));
    const j = await resp.json();
    return {
      text: j.choices?.[0]?.message?.content ?? "",
      inputTokens: num(j?.usage?.prompt_tokens),
      outputTokens: num(j?.usage?.completion_tokens),
    };
  }

  if (provider === "gemini") {
    const m = model || PROVIDER_DEFAULT_MODEL.gemini;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: augmented.map((mm) => ({
          role: mm.role === "assistant" ? "model" : "user",
          parts: [{ text: mm.content }],
        })),
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    if (!resp.ok) throw new Error(await readError(resp));
    const j = await resp.json();
    return (j.candidates?.[0]?.content?.parts || [])
      .map((p: { text?: string }) => p.text || "")
      .join("");
  }

  throw new Error(`Unknown provider "${provider}"`);
}

export type ResolvedProvider = {
  provider: ProviderId;
  apiKey: string;
  model: string;
  isPlatformFallback: boolean;
};

export async function resolveActiveProvider(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
): Promise<ResolvedProvider | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_ai_provider")
    .eq("id", userId)
    .maybeSingle();
  const preferred = (profile?.default_ai_provider ?? null) as ProviderId | null;

  if (preferred && PROVIDERS.includes(preferred)) {
    const { data: row } = await supabase
      .from("user_provider_keys")
      .select("api_key,model")
      .eq("user_id", userId)
      .eq("provider", preferred)
      .maybeSingle();
    if (row?.api_key) {
      return {
        provider: preferred,
        apiKey: row.api_key,
        model: (row.model && row.model.trim()) || PROVIDER_DEFAULT_MODEL[preferred],
        isPlatformFallback: false,
      };
    }
  }

  // Try any connected key as a secondary personal fallback (e.g. default was unset).
  if (!preferred) {
    const { data: any } = await supabase
      .from("user_provider_keys")
      .select("provider,api_key,model")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (any?.api_key && PROVIDERS.includes(any.provider as ProviderId)) {
      const p = any.provider as ProviderId;
      return {
        provider: p,
        apiKey: any.api_key,
        model: (any.model && any.model.trim()) || PROVIDER_DEFAULT_MODEL[p],
        isPlatformFallback: false,
      };
    }
  }

  // Platform fallback
  const envProv = (process.env.AI_PROVIDER || "").toLowerCase() as ProviderId;
  if (PROVIDERS.includes(envProv)) {
    const { key } = envKey(envProv);
    if (key) {
      return {
        provider: envProv,
        apiKey: key,
        model: process.env.AI_MODEL || PROVIDER_DEFAULT_MODEL[envProv],
        isPlatformFallback: true,
      };
    }
  }
  return null;
}

export async function generateText(
  system: string,
  messages: ChatMessage[],
  userIdOrOpts:
    | string
    | { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string; attachments?: Attachment[] },
  legacyOpts?: { attachments?: Attachment[] },
): Promise<string> {
  // Support both call shapes so existing helpers keep compiling; projects.functions.ts uses the object form.
  let supabase: import("@supabase/supabase-js").SupabaseClient | null = null;
  let userId: string | null = null;
  let attachments: Attachment[] | undefined;
  if (typeof userIdOrOpts === "string") {
    userId = userIdOrOpts;
    attachments = legacyOpts?.attachments;
  } else {
    supabase = userIdOrOpts.supabase;
    userId = userIdOrOpts.userId;
    attachments = userIdOrOpts.attachments;
  }
  if (!supabase || !userId) {
    throw new Error("generateText requires { supabase, userId }.");
  }
  const resolved = await resolveActiveProvider(supabase, userId);
  if (!resolved) {
    throw new Error("NO_KEY_CONFIGURED: Add an API key in Settings → API Keys to start building.");
  }
  return callProvider(resolved.provider, resolved.apiKey, resolved.model, system, messages, { attachments });
}

// ---- Tolerant JSON parser + file sanitization ----

export type ParsedFile = { path: string; content: string };
export type ParsedResult = { title: string; summary: string; files: ParsedFile[] };

export function parseModelJson(raw: string): ParsedResult {
  let text = raw.trim();
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
- Motion libraries are ENCOURAGED and load from CDN — no build step:
  - GSAP + ScrollTrigger: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    and <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script> for scroll-driven storytelling, pinned sections, parallax, and staggered timeline reveals.
  - Lenis (https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js) is fine for smooth scrolling.
- Interactivity: prefer vanilla JS in a <script> tag. If the app truly needs React, load React 18 UMD + Babel Standalone from a CDN and write JSX inside <script type="text/babel">.
- No build steps, no npm imports, no local asset files. Images: inline SVG or https://placehold.co URLs.
- Multiple pages are allowed (e.g. "about.html") with relative links between them. Keep it to at most 4 files.
- Every page must be responsive, polished, and complete — real copy, no lorem ipsum, no TODO comments, no broken references.
- Keep total output under roughly 1800 lines so nothing is cut off. One excellent page beats four thin ones.

MOTION QUALITY BAR — this platform's signature is award-show-caliber motion (motionsites.ai / Awwwards tier). Unless the user explicitly asks for something plain or minimal, EVERY generated site should include:
- A deliberate entrance animation on load (staggered hero reveal, mask/curtain wipe, or letter-by-letter type-in).
- Scroll-triggered reveals throughout the page — IntersectionObserver for lighter builds, GSAP ScrollTrigger for anything cinematic (pinned sections, parallax layers, horizontal scroll galleries, timeline reveals).
- Interaction polish: magnetic buttons, hover/cursor-aware transforms, subtle inertia, custom cursor accents, or animated underlines. Ship the site as a piece of interactive design, not a static page.
`;

export const SYSTEM_GENERATE =
  "You are the build engine for CodingClerks, an AI app builder. A user will describe a website or app. Design and produce it at the quality bar of a senior product designer and front-end engineer: intentional palette, strong typography, real content inferred from the request, responsive layout, and signature motion." +
  OUTPUT_CONTRACT;

export const SYSTEM_EDIT =
  "You are the build engine for CodingClerks. You will receive the COMPLETE current files of a user's project as JSON, followed by an edit instruction. Apply the instruction to the existing design — do not restart from scratch, preserve everything the user did not ask to change, including existing motion and animation code. Return the COMPLETE updated project: include EVERY file with FULL content, even files you did not modify. Files you omit will be deleted." +
  OUTPUT_CONTRACT;

export const SYSTEM_CLONE =
  "You are the build engine for CodingClerks. You will receive scraped content and metadata from a real website. Recreate it as a modern, original static web app: preserve the information architecture, page structure, headings, and text content, but implement a fresh, cleaner visual design with signature motion. Do not attempt to copy proprietary logos or images — use inline SVG placeholders or https://placehold.co with descriptive labels instead." +
  OUTPUT_CONTRACT;
