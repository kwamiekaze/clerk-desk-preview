/**
 * Admin / control-room mock layer.
 *
 * ADMIN ACCESS IS SERVER-AUTHORIZED.
 * Hiding the navigation entry is convenience only; every endpoint below MUST
 * verify the session holds a server-issued `admin` claim (e.g. via Supabase
 * has_role(auth.uid(), 'admin')) before responding. Client state is never
 * trusted; the route renders an explicit unauthorized state for non-admins.
 *
 * BACKEND CONTRACT:
 * - GET  /api/admin/finance                  -> FinanceSnapshot
 * - GET  /api/admin/cogs                     -> CogsSnapshot
 * - GET  /api/admin/margin                   -> MarginByRoute[]
 * - GET  /api/admin/points-flow              -> PointsFlowSnapshot
 * - GET  /api/admin/health                   -> GenerationHealth
 * - GET  /api/admin/users?cursor&q           -> AdminUser[]
 * - POST /api/admin/adjust-points            -> PointAdjustment    (writes immutable audit row)
 * - GET/PATCH /api/admin/route-policy        -> RoutePolicy
 * - GET  /api/admin/alerts                   -> AbuseAlert[]
 * - GET  /api/admin/audit?cursor&filters     -> AuditEntry[]       (append-only)
 * - POST /api/admin/impersonate-request      -> ImpersonationRequest
 *   ^ requires explicit user-side approval token before any session is issued.
 */

import type { ModelTier } from "./types";
import type { PlanId } from "./billing";

const wait = (ms = 260) => new Promise((r) => setTimeout(r, ms));
const iso = (d: Date) => d.toISOString();
const days = (n: number) => new Date(Date.now() + n * 86400_000);

export type FinanceSnapshot = {
  mrrUsd: number;
  mrrDeltaPct: number;
  arrUsd: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  topupRevenueUsd30d: number;
  refundsUsd30d: number;
  netRevenueUsd30d: number;
  byPlan: Array<{ planId: PlanId; subs: number; mrrUsd: number }>;
};

export type CogsSnapshot = {
  totalUsd30d: number;
  openrouterUsd30d: number;
  firecrawlUsd30d: number;
  sandboxUsd30d: number;
  byDay: Array<{ date: string; openrouter: number; firecrawl: number; sandbox: number }>;
};

export type MarginByRoute = {
  route: ModelTier;
  revenueUsd: number;
  cogsUsd: number;
  grossMarginPct: number;
  pointsBurned: number;
};

export type PointsFlowSnapshot = {
  issued30d: number;
  used30d: number;
  expired30d: number;
  refunded30d: number;
  adjusted30d: number;
  byBucket: Array<{ bucket: "daily" | "monthly" | "rollover" | "promotional" | "purchased"; issued: number; used: number }>;
};

export type GenerationHealth = {
  successRatePct: number;
  retryRatePct: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  satisfactionScore: number; // 1..5
  runs30d: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  planId: PlanId;
  pointsAvailable: number;
  pointsUsed30d: number;
  status: "active" | "suspended" | "trialing";
  joinedAt: string;
};

export type PointAdjustment = {
  id: string;
  userId: string;
  amount: number;
  reason: "refund_provider_failure" | "goodwill" | "abuse_clawback" | "manual_grant" | "support_correction";
  note: string;
  actorId: string;
  at: string;
};

export type RoutePolicy = {
  weights: Record<ModelTier, number>;            // routing weight per tier
  perRouteBudgetCp: Record<ModelTier, number>;
  fallbackOrder: ModelTier[];
  killSwitches: { provider: "openrouter" | "openai" | "anthropic"; disabled: boolean }[];
};

export type AbuseAlert = {
  id: string;
  severity: "low" | "medium" | "high";
  kind: "anomalous_spend" | "credential_brute_force" | "scrape_loop" | "deploy_storm";
  subject: string;       // user / workspace label
  detail: string;
  at: string;
  acknowledged: boolean;
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  ip: string;
  meta?: Record<string, string | number>;
};

export type ImpersonationRequest = {
  id: string;
  requestedBy: string;
  targetUserId: string;
  targetEmail: string;
  reason: string;
  status: "pending_user_approval" | "approved" | "denied" | "expired";
  expiresAt: string;
  /** Audit warning: every keystroke is logged; user must approve in their own console. */
  auditNotice: string;
};

/* ===================== MOCK DATA ===================== */

const finance: FinanceSnapshot = {
  mrrUsd: 18_420,
  mrrDeltaPct: 12.4,
  arrUsd: 221_040,
  activeSubscriptions: 1_284,
  trialingSubscriptions: 92,
  topupRevenueUsd30d: 4_812,
  refundsUsd30d: 318,
  netRevenueUsd30d: 22_914,
  byPlan: [
    { planId: "free",    subs: 4203, mrrUsd: 0 },
    { planId: "starter", subs: 612,  mrrUsd: 3_053 },
    { planId: "builder", subs: 488,  mrrUsd: 4_875 },
    { planId: "pro",     subs: 184,  mrrUsd: 2_758 },
  ],
};

const cogs: CogsSnapshot = {
  totalUsd30d: 7_812,
  openrouterUsd30d: 4_120,
  firecrawlUsd30d: 1_544,
  sandboxUsd30d: 2_148,
  byDay: Array.from({ length: 14 }, (_, i) => ({
    date: iso(days(-13 + i)),
    openrouter: 220 + Math.round(Math.random() * 120),
    firecrawl:  80 + Math.round(Math.random() * 60),
    sandbox:    140 + Math.round(Math.random() * 80),
  })),
};

const marginByRoute: MarginByRoute[] = [
  { route: "fast",        revenueUsd: 3_120, cogsUsd: 612,   grossMarginPct: 80, pointsBurned: 22_400 },
  { route: "recommended", revenueUsd: 9_840, cogsUsd: 3_412, grossMarginPct: 65, pointsBurned: 41_200 },
  { route: "premium",     revenueUsd: 6_220, cogsUsd: 3_322, grossMarginPct: 47, pointsBurned: 12_640 },
  { route: "automatic",   revenueUsd: 1_840, cogsUsd: 466,   grossMarginPct: 75, pointsBurned: 7_980 },
];

const pointsFlow: PointsFlowSnapshot = {
  issued30d: 412_000,
  used30d:   294_800,
  expired30d: 38_400,
  refunded30d: 4_120,
  adjusted30d: 880,
  byBucket: [
    { bucket: "daily",       issued: 92_000,  used: 78_200 },
    { bucket: "monthly",     issued: 248_000, used: 168_400 },
    { bucket: "rollover",    issued: 24_000,  used: 18_100 },
    { bucket: "promotional", issued: 16_000,  used: 12_400 },
    { bucket: "purchased",   issued: 32_000,  used: 17_700 },
  ],
};

const health: GenerationHealth = {
  successRatePct: 96.4,
  retryRatePct: 4.1,
  p50LatencyMs: 1_820,
  p95LatencyMs: 8_640,
  satisfactionScore: 4.6,
  runs30d: 38_412,
};

const adminUsers: AdminUser[] = [
  { id: "u_001", name: "Avery Vance",  email: "avery@nightowl.studio",  workspaceId: "w_nightowl", workspaceName: "Night Owl Studio", planId: "builder", pointsAvailable: 42, pointsUsed30d: 480, status: "active",    joinedAt: iso(days(-92)) },
  { id: "u_002", name: "Lex Romero",   email: "lex@studio.dev",          workspaceId: "w_studio",   workspaceName: "Studio Dev",       planId: "pro",     pointsAvailable: 188, pointsUsed30d: 712, status: "active",    joinedAt: iso(days(-150)) },
  { id: "u_003", name: "Hana Park",    email: "hana@solo.cc",            workspaceId: "w_solo",     workspaceName: "Solo",             planId: "starter", pointsAvailable: 8,   pointsUsed30d: 60,  status: "trialing",  joinedAt: iso(days(-4)) },
  { id: "u_004", name: "Mateo Reyes",  email: "mateo@blocked.dev",       workspaceId: "w_blocked",  workspaceName: "Blocked LLC",      planId: "free",    pointsAvailable: 0,   pointsUsed30d: 30,  status: "suspended", joinedAt: iso(days(-60)) },
];

const alerts: AbuseAlert[] = [
  { id: "al_1", severity: "high",   kind: "anomalous_spend",      subject: "w_blocked / Blocked LLC", detail: "Burned 480 CP in 12 minutes; 6× p95 baseline.", at: iso(days(-0.2)), acknowledged: false },
  { id: "al_2", severity: "medium", kind: "scrape_loop",          subject: "u_003 / Hana Park",       detail: "82 Firecrawl jobs on the same domain in 1h.",   at: iso(days(-1)),   acknowledged: false },
  { id: "al_3", severity: "low",    kind: "credential_brute_force", subject: "anon",                  detail: "12 failed OpenRouter verify calls from 1 IP.",  at: iso(days(-2)),   acknowledged: true  },
];

const audit: AuditEntry[] = [
  { id: "a_1", actor: "admin@codingclerks.dev", action: "user.suspend",        target: "u_004",   at: iso(days(-0.5)), ip: "203.0.113.7",  meta: { reason: "abuse_clawback" } },
  { id: "a_2", actor: "support@codingclerks.dev", action: "points.adjust",     target: "u_001",   at: iso(days(-1)),   ip: "198.51.100.4", meta: { amount: 20, reason: "refund_provider_failure" } },
  { id: "a_3", actor: "system",                   action: "policy.update",     target: "route:premium", at: iso(days(-2)), ip: "internal", meta: { hardBudgetCp: 60 } },
  { id: "a_4", actor: "admin@codingclerks.dev",   action: "impersonation.request", target: "u_002", at: iso(days(-3)), ip: "203.0.113.7" },
];

const routePolicy: RoutePolicy = {
  weights:           { automatic: 1, fast: 0.6, recommended: 1.15, premium: 1.8 },
  perRouteBudgetCp:  { automatic: 40, fast: 20, recommended: 50,   premium: 80 },
  fallbackOrder:     ["recommended", "fast", "premium", "automatic"],
  killSwitches: [
    { provider: "openrouter", disabled: false },
    { provider: "openai",     disabled: false },
    { provider: "anthropic",  disabled: false },
  ],
};

/* ===================== API ===================== */

export const adminApi = {
  async getFinance() { await wait(); return finance; },
  async getCogs() { await wait(); return cogs; },
  async getMargin() { await wait(); return marginByRoute; },
  async getPointsFlow() { await wait(); return pointsFlow; },
  async getHealth() { await wait(); return health; },
  async listUsers(_q?: string) { await wait(); return adminUsers; },
  async getAlerts() { await wait(); return alerts; },
  async acknowledgeAlert(_id: string) { await wait(); },
  async getAudit() { await wait(); return audit; },
  async getRoutePolicy() { await wait(); return routePolicy; },
  async updateRoutePolicy(_patch: Partial<RoutePolicy>) { await wait(); return routePolicy; },
  async adjustPoints(input: { userId: string; amount: number; reason: PointAdjustment["reason"]; note: string }): Promise<PointAdjustment> {
    await wait(360);
    return { id: "adj_" + Math.random().toString(36).slice(2, 7), ...input, actorId: "admin@codingclerks.dev", at: iso(new Date()) };
  },
  async requestImpersonation(input: { targetUserId: string; targetEmail: string; reason: string }): Promise<ImpersonationRequest> {
    await wait(380);
    return {
      id: "imp_" + Math.random().toString(36).slice(2, 7),
      requestedBy: "admin@codingclerks.dev",
      targetUserId: input.targetUserId,
      targetEmail: input.targetEmail,
      reason: input.reason,
      status: "pending_user_approval",
      expiresAt: iso(days(0.25)),
      auditNotice:
        "Impersonation requires the target user to approve in their own console. Every action you take while impersonating is recorded in the immutable audit log and visible to the user.",
    };
  },
};
