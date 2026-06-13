/**
 * Settings + integrations mock layer.
 *
 * BACKEND CONTRACT (server-authoritative; never client-trusted):
 * - GET/PATCH /api/settings/profile               -> Profile
 * - GET/PATCH /api/settings/workspace             -> WorkspaceSettings
 * - GET       /api/settings/members               -> WorkspaceMember[]
 * - POST      /api/settings/members/invite        -> Invite
 * - POST      /api/settings/members/:id/role      -> WorkspaceMember
 * - DELETE    /api/settings/members/:id           -> 204
 * - GET       /api/settings/credentials           -> CredentialStatus[]    (status only — NEVER the secret)
 * - POST      /api/settings/credentials/:id       -> { ok }   (server stores raw secret in vault)
 * - POST      /api/settings/credentials/:id/verify-> CredentialStatus
 * - DELETE    /api/settings/credentials/:id       -> CredentialStatus
 * - GET/PATCH /api/settings/routing               -> RoutingPrefs
 * - GET/PATCH /api/settings/privacy               -> PrivacyPrefs
 * - GET/PATCH /api/settings/notifications         -> NotificationPrefs
 * - POST      /api/settings/export                -> { jobId }  (async data export)
 * - POST      /api/settings/danger/delete-workspace -> { jobId } (requires re-auth + grace period)
 */

import type { ModelTier } from "./types";

export type Profile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  pronouns: string | null;
  timezone: string;
  locale: string;
  initials: string;
  twoFactorEnabled: boolean;
};

export type WorkspaceSettings = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  defaultRegion: "us-east" | "us-west" | "eu-west" | "ap-southeast";
  defaultSandbox: "e2b" | "vercel-sandbox";
  createdAt: string;
};

export type Role = "Owner" | "Admin" | "Member" | "Viewer";

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  monthlyPointLimit: number | null;
  usedThisMonth: number;
  joinedAt: string;
  lastActiveAt: string;
};

export type Invite = {
  id: string;
  email: string;
  role: Role;
  invitedAt: string;
  invitedBy: string;
  status: "pending" | "expired";
};

export type ProviderId =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "firecrawl"
  | "vercel"
  | "e2b"
  | "github";

export type CredentialStatus = {
  provider: ProviderId;
  label: string;
  blurb: string;
  /** Never returns the secret — only status. */
  status: "not_connected" | "connected" | "needs_attention";
  lastVerifiedAt: string | null;
  scope?: string;
  /** Server-side hash fingerprint for replace-detection only. */
  fingerprint?: string | null;
};

export type RoutingPrefs = {
  defaultTier: ModelTier;
  allowAutoUpgrade: boolean;       // routing may escalate to premium on hard tasks
  hardBudgetPerRun: number;        // CP — hard cap regardless of estimate
  preferProviders: ProviderId[];   // soft preference ordering
};

export type PrivacyPrefs = {
  retainProjectsDays: number;        // 30..730
  retainLogsDays: number;            // 7..365
  allowModelTraining: boolean;       // opt-in
  allowAnonymousMetrics: boolean;
  scrubPII: boolean;
};

export type NotificationChannel = "email" | "in_app" | "github";
export type NotificationKey =
  | "build_failed"
  | "deploy_completed"
  | "low_balance"
  | "invoice_paid"
  | "weekly_digest"
  | "abuse_alert";

export type NotificationPrefs = Record<
  NotificationKey,
  { channels: NotificationChannel[]; label: string; description: string }
>;

/* ===================== MOCK DATA ===================== */

const wait = (ms = 260) => new Promise((r) => setTimeout(r, ms));
const iso = (d: Date) => d.toISOString();
const days = (n: number) => new Date(Date.now() + n * 86400_000);

const profile: Profile = {
  id: "u_avery",
  name: "Avery Vance",
  email: "avery@nightowl.studio",
  avatarUrl: null,
  pronouns: "they/them",
  timezone: "America/New_York",
  locale: "en-US",
  initials: "AV",
  twoFactorEnabled: true,
};

const workspace: WorkspaceSettings = {
  id: "w_nightowl",
  name: "Night Owl Studio",
  slug: "nightowl",
  logoUrl: null,
  defaultRegion: "us-east",
  defaultSandbox: "e2b",
  createdAt: iso(days(-92)),
};

const members: WorkspaceMember[] = [
  { id: "u_1", name: "Avery Vance",  email: "avery@nightowl.studio",  role: "Owner",  monthlyPointLimit: null, usedThisMonth: 32, joinedAt: iso(days(-92)), lastActiveAt: iso(days(0)) },
  { id: "u_2", name: "Sasha Patel",  email: "sasha@nightowl.studio",  role: "Admin",  monthlyPointLimit: 80,   usedThisMonth: 41, joinedAt: iso(days(-60)), lastActiveAt: iso(days(-1)) },
  { id: "u_3", name: "Kai Nguyen",   email: "kai@nightowl.studio",    role: "Member", monthlyPointLimit: 40,   usedThisMonth: 38, joinedAt: iso(days(-30)), lastActiveAt: iso(days(-2)) },
  { id: "u_4", name: "Rin Tanaka",   email: "rin@nightowl.studio",    role: "Viewer", monthlyPointLimit: 0,    usedThisMonth: 0,  joinedAt: iso(days(-7)),  lastActiveAt: iso(days(-7)) },
];

const invites: Invite[] = [
  { id: "inv_1", email: "jordan@nightowl.studio", role: "Member", invitedAt: iso(days(-3)), invitedBy: "Avery Vance", status: "pending" },
  { id: "inv_2", email: "lex@studio.dev",          role: "Admin",  invitedAt: iso(days(-12)), invitedBy: "Avery Vance", status: "expired" },
];

const credentials: CredentialStatus[] = [
  { provider: "openrouter", label: "OpenRouter",  blurb: "Unified routing across 300+ models.", status: "connected",     lastVerifiedAt: iso(days(-1)), scope: "all_models", fingerprint: "fp_or_2a8" },
  { provider: "openai",     label: "OpenAI",      blurb: "GPT-class models for high-quality output.", status: "connected", lastVerifiedAt: iso(days(-2)), scope: "org-default", fingerprint: "fp_oa_91b" },
  { provider: "anthropic",  label: "Anthropic",   blurb: "Claude models for code and reasoning.", status: "not_connected", lastVerifiedAt: null },
  { provider: "firecrawl",  label: "Firecrawl",   blurb: "Crawl public URLs for clone workflows.", status: "connected",  lastVerifiedAt: iso(days(-4)), scope: "scrape, map, crawl", fingerprint: "fp_fc_77c" },
  { provider: "vercel",     label: "Vercel",      blurb: "One-click deployments for previews & prod.", status: "needs_attention", lastVerifiedAt: iso(days(-30)), scope: "team:nightowl" },
  { provider: "e2b",        label: "E2B Sandbox", blurb: "Isolated dev sandboxes for live preview.", status: "connected", lastVerifiedAt: iso(days(-6)), scope: "compute:medium", fingerprint: "fp_e2b_03d" },
  { provider: "github",     label: "GitHub",      blurb: "Export & sync projects to repositories.", status: "connected", lastVerifiedAt: iso(days(-1)), scope: "repo, workflow", fingerprint: "fp_gh_55a" },
];

const routing: RoutingPrefs = {
  defaultTier: "recommended",
  allowAutoUpgrade: true,
  hardBudgetPerRun: 40,
  preferProviders: ["openrouter", "anthropic", "openai"],
};

const privacy: PrivacyPrefs = {
  retainProjectsDays: 365,
  retainLogsDays: 90,
  allowModelTraining: false,
  allowAnonymousMetrics: true,
  scrubPII: true,
};

const notifications: NotificationPrefs = {
  build_failed:     { channels: ["email", "in_app"], label: "Build failed", description: "Send a heads-up when a clerk run errors out." },
  deploy_completed: { channels: ["in_app"],          label: "Deploy completed", description: "Notify when a Vercel deploy finishes." },
  low_balance:      { channels: ["email", "in_app"], label: "Low CP balance", description: "Warn before runs get blocked." },
  invoice_paid:     { channels: ["email"],            label: "Invoice paid", description: "Receipts and renewal confirmations." },
  weekly_digest:    { channels: ["email"],            label: "Weekly digest", description: "Usage, top projects, and ledger summary." },
  abuse_alert:      { channels: ["email", "in_app"], label: "Abuse alerts", description: "Anomalous spend or repeated failures." },
};

/* ===================== API ===================== */

export const settingsApi = {
  async getProfile() { await wait(); return profile; },
  async updateProfile(_patch: Partial<Profile>) { await wait(); return profile; },

  async getWorkspace() { await wait(); return workspace; },
  async updateWorkspace(_patch: Partial<WorkspaceSettings>) { await wait(); return workspace; },

  async getMembers() { await wait(); return { members, invites }; },
  async invite(_email: string, _role: Role): Promise<Invite> {
    await wait();
    return { id: "inv_new", email: _email, role: _role, invitedAt: iso(new Date()), invitedBy: profile.name, status: "pending" };
  },
  async setRole(_id: string, _role: Role) { await wait(); },
  async removeMember(_id: string) { await wait(); },
  async setMemberPointLimit(_id: string, _limit: number | null) { await wait(); },

  /** Returns status only. The server vault stores secrets; never returned to client. */
  async getCredentials(): Promise<CredentialStatus[]> { await wait(); return credentials; },
  async saveCredential(provider: ProviderId, _rawSecret: string): Promise<CredentialStatus> {
    await wait(420);
    return { ...credentials.find((c) => c.provider === provider)!, status: "connected", lastVerifiedAt: iso(new Date()), fingerprint: "fp_new" };
  },
  async verifyCredential(provider: ProviderId): Promise<CredentialStatus> {
    await wait(380);
    return { ...credentials.find((c) => c.provider === provider)!, status: "connected", lastVerifiedAt: iso(new Date()) };
  },
  async revokeCredential(provider: ProviderId): Promise<CredentialStatus> {
    await wait();
    return { ...credentials.find((c) => c.provider === provider)!, status: "not_connected", lastVerifiedAt: null, fingerprint: null };
  },

  async getRouting(): Promise<RoutingPrefs> { await wait(); return routing; },
  async updateRouting(_patch: Partial<RoutingPrefs>) { await wait(); return routing; },

  async getPrivacy(): Promise<PrivacyPrefs> { await wait(); return privacy; },
  async updatePrivacy(_patch: Partial<PrivacyPrefs>) { await wait(); return privacy; },

  async getNotifications(): Promise<NotificationPrefs> { await wait(); return notifications; },
  async updateNotifications(_patch: Partial<NotificationPrefs>) { await wait(); return notifications; },

  async requestExport() { await wait(); return { jobId: "job_export_001" }; },
  async deleteWorkspace(_confirm: string) { await wait(); return { jobId: "job_delete_001" }; },
};

export const PROVIDER_DOCS: Record<ProviderId, string> = {
  openrouter: "https://openrouter.ai/keys",
  openai:     "https://platform.openai.com/api-keys",
  anthropic:  "https://console.anthropic.com/settings/keys",
  firecrawl:  "https://firecrawl.dev/app/api-keys",
  vercel:     "https://vercel.com/account/tokens",
  e2b:        "https://e2b.dev/dashboard?tab=keys",
  github:     "https://github.com/settings/tokens",
};
