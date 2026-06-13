/**
 * Typed adapter layer for the CodingClerks builder workspace.
 *
 * These functions are mocks. Each one names the real server contract it will
 * front when wired. Keep the signatures stable — the streaming engine,
 * Firecrawl, file API, and sandbox (E2B / Vercel) integrations will plug
 * into these adapters without UI changes.
 *
 * Server contracts:
 *   - streamGeneration       -> POST /api/agents/run                (SSE/UIMessage stream)
 *   - listFiles / readFile   -> GET  /api/projects/:id/files        (sandbox file API)
 *   - writeFile / applyPatch -> POST /api/projects/:id/files        (sandbox file API)
 *   - getDiff                -> GET  /api/projects/:id/files/:path/diff
 *   - getPreviewUrl          -> GET  /api/sandbox/:id/preview       (E2B/Vercel)
 *   - runCommand             -> POST /api/sandbox/:id/exec
 *   - firecrawlClone         -> POST /api/firecrawl/scrape
 *   - listVersions/restore   -> /api/projects/:id/versions
 *   - exportToGithub         -> POST /api/integrations/github/export
 *   - deployToVercel         -> POST /api/integrations/vercel/deploy
 */

export type BuildState = "idle" | "thinking" | "streaming" | "installing" | "validating" | "ready" | "error";
export type BranchInfo = { name: string; ahead: number; behind: number; dirty: boolean };

export type FileNode = {
  path: string;
  kind: "file" | "dir";
  size?: number;
  changed?: "added" | "modified" | "deleted" | null;
  language?: string;
};

export type FileBlob = {
  path: string;
  language: string;
  content: string;
  diff?: { hunks: DiffHunk[] };
};

export type DiffHunk = {
  header: string;
  lines: { kind: "ctx" | "add" | "del"; text: string }[];
};

export type ClerkRole = "intake" | "designer" | "engineer" | "qa" | "preview" | "deploy";

export type StreamPart =
  | { type: "plan"; id: string; title: string; steps: string[] }
  | { type: "thinking"; id: string; text: string }
  | { type: "tool"; id: string; name: string; status: "run" | "ok" | "warn"; detail?: string }
  | { type: "file"; id: string; path: string; op: "create" | "edit" | "delete"; bytes: number }
  | { type: "install"; id: string; pkg: string; version: string }
  | { type: "command"; id: string; cmd: string; output?: string }
  | { type: "validation"; id: string; check: string; status: "ok" | "warn" | "fail"; detail?: string }
  | { type: "message"; id: string; text: string }
  | { type: "receipt"; id: string; pointsSpent: number; tokens: number; ms: number };

export type ChatMessage = {
  id: string;
  role: "user" | "clerk" | "system";
  text: string;
  at: string;
  attachments?: { name: string; kind: "image" | "file" | "url" }[];
  scope?: string[]; // file paths the user pinned
  receipt?: { pointsSpent: number; tokens: number; ms: number };
  parts?: StreamPart[];
};

export type BuildError = {
  id: string;
  source: "typescript" | "runtime" | "build" | "lint";
  message: string;
  file?: string;
  line?: number;
};

export type Version = {
  id: string;
  label: string;
  at: string;
  author: string;
  summary: string;
  filesChanged: number;
  pointsSpent: number;
};

export type PreviewSize = "desktop" | "tablet" | "mobile";

export type ModelRoute = "automatic" | "fast" | "recommended" | "premium";

export type ChatRequest = {
  text: string;
  attachments?: { name: string; kind: "image" | "file" | "url" }[];
  scope?: string[];
  model: ModelRoute;
  maxPoints: number;
};

// ------------------------------- mock data -------------------------------

const FILES: FileNode[] = [
  { path: "src/", kind: "dir" },
  { path: "src/App.tsx", kind: "file", language: "tsx", size: 1840, changed: "modified" },
  { path: "src/main.tsx", kind: "file", language: "tsx", size: 320 },
  { path: "src/components/", kind: "dir" },
  { path: "src/components/Hero.tsx", kind: "file", language: "tsx", size: 1280, changed: "added" },
  { path: "src/components/Feature.tsx", kind: "file", language: "tsx", size: 980, changed: "added" },
  { path: "src/components/CTA.tsx", kind: "file", language: "tsx", size: 640 },
  { path: "src/styles.css", kind: "file", language: "css", size: 2310, changed: "modified" },
  { path: "package.json", kind: "file", language: "json", size: 540, changed: "modified" },
  { path: "README.md", kind: "file", language: "md", size: 410 },
];

const HERO_SOURCE = `import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
          New — agentic web builder
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">
          Ship real apps from a single brief.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Clerks plan, design, and engineer your product in an isolated sandbox.
        </p>
        <a
          href="#start"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Start a build <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
`;

const APP_SOURCE = `import { Hero } from "./components/Hero";
import { Feature } from "./components/Feature";
import { CTA } from "./components/CTA";

export default function App() {
  return (
    <main>
      <Hero />
      <Feature />
      <CTA />
    </main>
  );
}
`;

const HERO_DIFF: DiffHunk[] = [
  {
    header: "@@ -1,3 +1,5 @@",
    lines: [
      { kind: "ctx", text: 'import { ArrowRight } from "lucide-react";' },
      { kind: "ctx", text: "" },
      { kind: "del", text: "export function Hero() {" },
      { kind: "add", text: "export function Hero() {" },
      { kind: "add", text: '  // Engineer clerk: tightened tracking + added eyebrow.' },
    ],
  },
];

const VERSIONS: Version[] = [
  { id: "v_07", label: "v0.7 — Hero polish",     at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),  author: "Engineer clerk", summary: "Refined hero hierarchy, added eyebrow.",  filesChanged: 2,  pointsSpent: 0.6 },
  { id: "v_06", label: "v0.6 — Feature grid",    at: new Date(Date.now() - 1000 * 60 * 22).toISOString(), author: "Designer clerk", summary: "Added Feature.tsx + responsive grid.",   filesChanged: 4,  pointsSpent: 1.2 },
  { id: "v_05", label: "v0.5 — Scaffold",        at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), author: "Intake clerk",   summary: "Initial scaffold from brief.",            filesChanged: 14, pointsSpent: 2.4 },
];

// -------------------------------- adapters --------------------------------

const wait = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const builderApi = {
  /** GET /api/projects/:id  — header + branch + state */
  async getProject(id: string) {
    await wait(120);
    return {
      id,
      name: id.replace(/[-_]/g, " "),
      branch: { name: "main", ahead: 2, behind: 0, dirty: true } as BranchInfo,
      state: "ready" as BuildState,
      previewUrl: "about:blank", // sandbox URL injected at runtime
      repo: null as string | null,
      deployment: null as { url: string; env: "preview" | "production" } | null,
    };
  },

  /** GET /api/projects/:id/files */
  async listFiles(_id: string): Promise<FileNode[]> {
    await wait(160);
    return FILES;
  },

  /** GET /api/projects/:id/files/:path */
  async readFile(_id: string, path: string): Promise<FileBlob> {
    await wait(140);
    if (path.endsWith("Hero.tsx")) {
      return { path, language: "tsx", content: HERO_SOURCE, diff: { hunks: HERO_DIFF } };
    }
    if (path.endsWith("App.tsx")) return { path, language: "tsx", content: APP_SOURCE };
    return { path, language: "txt", content: `// ${path}\n// (mock content)\n` };
  },

  /** GET /api/projects/:id/versions */
  async listVersions(_id: string): Promise<Version[]> {
    await wait(160);
    return VERSIONS;
  },

  async listErrors(_id: string): Promise<BuildError[]> {
    await wait(120);
    return [];
  },

  /** Mock the streaming generation engine. Real impl: SSE/AI-SDK UIMessage stream. */
  streamChat(
    req: ChatRequest,
    handlers: {
      onPart: (part: StreamPart) => void;
      onState: (state: BuildState) => void;
      onDone: (msg: ChatMessage) => void;
    },
    signal?: AbortSignal,
  ) {
    const parts: StreamPart[] = [];
    const emit = (p: StreamPart) => {
      parts.push(p);
      handlers.onPart(p);
    };

    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    handlers.onState("thinking");
    at(220, () => emit({ type: "thinking", id: "t1", text: "Reading scope + recent diffs…" }));
    at(700, () =>
      emit({
        type: "plan",
        id: "pl1",
        title: "Refine hero + add testimonial strip",
        steps: ["Audit hero hierarchy", "Extract testimonial component", "Wire into App.tsx", "Run typecheck"],
      }),
    );
    at(1100, () => handlers.onState("streaming"));
    at(1200, () => emit({ type: "tool", id: "to1", name: "search_files", status: "ok", detail: "matched 3" }));
    at(1600, () => emit({ type: "file", id: "f1", path: "src/components/Hero.tsx", op: "edit", bytes: 248 }));
    at(2000, () => emit({ type: "file", id: "f2", path: "src/components/Testimonials.tsx", op: "create", bytes: 1240 }));
    at(2400, () => handlers.onState("installing"));
    at(2500, () => emit({ type: "install", id: "i1", pkg: "embla-carousel-react", version: "8.3.0" }));
    at(2900, () => emit({ type: "command", id: "c1", cmd: "bun add embla-carousel-react", output: "+ 1 package, 0 vulnerabilities" }));
    at(3200, () => handlers.onState("validating"));
    at(3300, () => emit({ type: "validation", id: "v1", check: "typescript", status: "ok" }));
    at(3600, () => emit({ type: "validation", id: "v2", check: "lint", status: "ok" }));
    at(3900, () =>
      emit({
        type: "message",
        id: "m1",
        text: "Hero is tightened and a testimonial strip is wired beneath it. Preview should reload momentarily.",
      }),
    );
    at(4100, () => {
      const receipt: StreamPart = { type: "receipt", id: "r1", pointsSpent: 4, tokens: 18420, ms: 4080 };
      emit(receipt);
      handlers.onState("ready");
      handlers.onDone({
        id: "msg_" + Math.random().toString(36).slice(2, 7),
        role: "clerk",
        text: "Hero tightened + testimonial strip added.",
        at: new Date().toISOString(),
        parts,
        receipt: { pointsSpent: 4, tokens: 18420, ms: 4080 },
      });
    });

    signal?.addEventListener("abort", () => {
      timers.forEach(clearTimeout);
      handlers.onState("idle");
    });

    return () => timers.forEach(clearTimeout);
  },

  estimate(req: Pick<ChatRequest, "model" | "text" | "scope">) {
    const base = Math.max(1, Math.round(req.text.length / 220));
    const scope = (req.scope?.length ?? 0) * 0.6;
    const mult = req.model === "premium" ? 2.2 : req.model === "fast" ? 0.55 : req.model === "recommended" ? 1.2 : 1;
    const min = Math.max(1, Math.round((base + scope) * mult));
    return { min, max: min + 3 };
  },

  /** POST /api/integrations/github/export */
  async exportToGithub(_id: string, repo: string) {
    await wait(540);
    return { url: `https://github.com/${repo}`, branch: "codingclerks/initial" };
  },

  /** POST /api/integrations/vercel/deploy */
  async deployToVercel(_id: string, env: "preview" | "production") {
    await wait(640);
    return { url: `https://${_id}-${env}.vercel.app`, env };
  },
};
