/**
 * Typed mock layer for Coding Points (CP), subscriptions, top-ups, billing.
 *
 * BACKEND CONTRACT (must remain server-side; never client-authoritative):
 * - POST /api/billing/checkout                 -> CheckoutSession   (Stripe checkout.sessions.create)
 * - POST /api/billing/portal                   -> CustomerPortalSession
 * - GET  /api/billing/subscription             -> SubscriptionStatus
 * - GET  /api/billing/points                   -> PointBalance
 * - GET  /api/billing/ledger?cursor&filters    -> PointLedgerEntry[]
 * - GET  /api/billing/usage?range&groupBy      -> UsageBucket[]
 * - GET  /api/billing/invoices                 -> Invoice[]
 * - POST /api/billing/topup                    -> CheckoutSession
 * - POST /api/billing/members/:id/limit        -> MemberLimit
 * - POST /api/webhooks/stripe                  -> verify signature, grant/deduct
 * - POST /api/agents/estimate                  -> EstimateRange  (server-priced; client value is hint only)
 * - POST /api/agents/charge                    -> UsageReceipt   (final, idempotent; provider failures = 0 AI charge)
 *
 * Spending order (enforced server-side):
 *   1. expiring daily   2. promotional   3. monthly   4. rollover   5. purchased
 */

export type Cadence = "monthly" | "annual";
export type PlanId = "free" | "starter" | "builder" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  priceMonthly: number;          // USD
  priceAnnual: number;           // USD / month when billed annually
  monthlyPoints: number;         // CP granted on renewal
  dailyPoints: number;           // CP granted per calendar day
  dailyCap: number;              // hard cap on daily CP per calendar month
  rollover: boolean;             // unspent monthly CP rolls over up to 1× monthly grant
  highlight?: boolean;
  blurb: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    monthlyPoints: 0,
    dailyPoints: 5,
    dailyCap: 30,
    rollover: false,
    blurb: "Kick the tires. No card required.",
    features: ["5 daily CP (cap 30/mo)", "1 active desk", "Public previews", "Community support"],
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 4.99,
    priceAnnual: 3.99,
    monthlyPoints: 20,
    dailyPoints: 5,
    dailyCap: 30,
    rollover: true,
    blurb: "For hobby projects and prototypes.",
    features: ["20 monthly CP + 5 daily (cap 30)", "Private sandboxes", "GitHub export", "Email support"],
  },
  {
    id: "builder",
    name: "Builder",
    priceMonthly: 9.99,
    priceAnnual: 7.99,
    monthlyPoints: 40,
    dailyPoints: 5,
    dailyCap: 60,
    rollover: true,
    highlight: true,
    blurb: "The bureau's daily driver.",
    features: ["40 monthly CP + 5 daily (cap 60)", "Vercel deploys", "Version history", "Priority clerks"],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 14.99,
    priceAnnual: 11.99,
    monthlyPoints: 60,
    dailyPoints: 5,
    dailyCap: 90,
    rollover: true,
    blurb: "For active studios shipping every day.",
    features: ["60 monthly CP + 5 daily (cap 90)", "Workspace seats", "Member limits", "SLA support"],
  },
];

export type TopUp = {
  id: "tu_20" | "tu_50";
  points: number;
  priceUsd: number;
  recommended?: boolean;
};

export const TOPUPS: TopUp[] = [
  { id: "tu_20", points: 20, priceUsd: 5.99 },
  { id: "tu_50", points: 50, priceUsd: 14.99, recommended: true },
];

/* --- Stripe-shaped session DTOs ------------------------------------------ */

export type CheckoutSession = {
  id: string;                // cs_test_...
  url: string;               // Stripe-hosted Checkout URL
  expiresAt: string;
  mode: "subscription" | "payment";
  planId?: PlanId;
  topupId?: TopUp["id"];
  cadence?: Cadence;
};

export type CustomerPortalSession = {
  id: string;
  url: string;               // Stripe-hosted portal URL
  returnUrl: string;
};

/* --- Subscription -------------------------------------------------------- */

export type SubscriptionStatus = {
  planId: PlanId;
  cadence: Cadence;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  seats: number;
  customerId: string;        // cus_... (read-only on client)
};

/* --- Points -------------------------------------------------------------- */

export type PointBucket = "daily" | "promotional" | "monthly" | "rollover" | "purchased";

export type PointBalance = {
  total: number;
  byBucket: Record<PointBucket, number>;
  dailyResetAt: string;
  monthlyResetAt: string;
  dailyUsedThisMonth: number;
  dailyCapThisMonth: number;
};

export type PointGrant = {
  id: string;
  bucket: PointBucket;
  amount: number;
  grantedAt: string;
  expiresAt: string | null;
  reason: string;            // "subscription_renewal" | "daily_grant" | "promo_signup" | "topup_purchase" | ...
};

export type ReceiptLineKind =
  | "input_tokens"
  | "output_tokens"
  | "tool_call"
  | "crawl"
  | "sandbox"
  | "preview"
  | "deploy"
  | "discount";

export type ReceiptLine = {
  kind: ReceiptLineKind;
  label: string;
  detail?: string;
  points: number;            // fractional (0.1 step); negative for discounts/refunds
};

export type ReceiptStatus = "completed" | "partial" | "failed" | "refunded";

export type UsageReceipt = {
  id: string;
  messageId?: string;
  projectId: string;
  projectName: string;
  clerk: "intake" | "crawler" | "designer" | "engineer" | "qa" | "preview" | "deploy";
  modelRoute: "automatic" | "fast" | "recommended" | "premium" | "standard";
  modelRouteLabel: "Automatic" | "Standard" | "Premium";
  taskType: "scaffold" | "edit" | "repair" | "crawl" | "deploy" | "preview" | "qa";
  taskTypeLabel: string;            // user-facing, e.g. "Edit text", "Build landing page"
  member: { id: string; name: string };
  estimatedRange: { min: number; max: number };
  estimatedAt: string;
  finalCharge: number;              // fractional 0.1 step; 0 if provider failed / cancelled
  status: ReceiptStatus;
  firecrawlUsed: boolean;
  validationCompleted: boolean;
  durationMs: number;
  lines: ReceiptLine[];
  at: string;
};

export type PointLedgerEntry =
  | { kind: "grant"; id: string; at: string; grant: PointGrant }
  | { kind: "charge"; id: string; at: string; receipt: UsageReceipt; deductedFrom: PointBucket[] }
  | { kind: "refund"; id: string; at: string; receipt: UsageReceipt; bucket: PointBucket; amount: number; reason: string }
  | { kind: "expiry"; id: string; at: string; bucket: PointBucket; amount: number; reason: string };

/* --- Usage --------------------------------------------------------------- */

export type UsageGroupBy = "project" | "member" | "modelRoute" | "taskType";
export type UsageBucket = { key: string; label: string; points: number };

/* --- Invoices ------------------------------------------------------------ */

export type Invoice = {
  id: string;               // in_...
  number: string;
  amountUsd: number;
  status: "paid" | "open" | "void" | "refunded";
  issuedAt: string;
  hostedUrl: string;        // Stripe-hosted
  pdfUrl: string;
};

/* --- Member limits ------------------------------------------------------- */

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  monthlyLimit: number | null; // null = no per-member cap
  usedThisMonth: number;
};

/* ===================== MOCK DATA ===================== */

const wait = (ms = 280) => new Promise((r) => setTimeout(r, ms));
const iso = (d: Date) => d.toISOString();
const days = (n: number) => new Date(Date.now() + n * 86400_000);

const subscription: SubscriptionStatus = {
  planId: "builder",
  cadence: "monthly",
  status: "active",
  currentPeriodStart: iso(days(-12)),
  currentPeriodEnd: iso(days(18)),
  cancelAtPeriodEnd: false,
  seats: 3,
  customerId: "cus_mock_avery",
};

const balance: PointBalance = {
  total: 12.4,
  byBucket: { daily: 3.0, promotional: 1.5, monthly: 5.4, rollover: 1.5, purchased: 1.0 },
  dailyResetAt: iso(days(1)),
  monthlyResetAt: iso(days(18)),
  dailyUsedThisMonth: 14,
  dailyCapThisMonth: 60,
};

const receipts: UsageReceipt[] = [
  {
    id: "rcp_001",
    messageId: "msg_helio_42",
    projectId: "p_helio",
    projectName: "Helio Marketing",
    clerk: "engineer",
    modelRoute: "recommended",
    modelRouteLabel: "Standard",
    taskType: "scaffold",
    taskTypeLabel: "Build landing page with theme",
    member: { id: "u_1", name: "Avery Vance" },
    estimatedRange: { min: 2.0, max: 3.0 },
    estimatedAt: iso(days(-1)),
    finalCharge: 2.4,
    status: "completed",
    firecrawlUsed: false,
    validationCompleted: true,
    durationMs: 38_000,
    lines: [
      { kind: "tool_call", label: "Plan + scaffold", points: 0.9 },
      { kind: "output_tokens", label: "Component generation", points: 1.0 },
      { kind: "sandbox", label: "Preview build", detail: "38s", points: 0.5 },
    ],
    at: iso(days(-1)),
  },
  {
    id: "rcp_002",
    messageId: "msg_arc_19",
    projectId: "p_arc",
    projectName: "Arc Portfolio",
    clerk: "crawler",
    modelRoute: "fast",
    modelRouteLabel: "Standard",
    taskType: "crawl",
    taskTypeLabel: "Clone from URL",
    member: { id: "u_2", name: "Sasha Patel" },
    estimatedRange: { min: 1.5, max: 2.5 },
    estimatedAt: iso(days(-2)),
    finalCharge: 0,
    status: "failed",
    firecrawlUsed: true,
    validationCompleted: false,
    durationMs: 4_200,
    lines: [
      { kind: "crawl", label: "Firecrawl request", detail: "Provider 503 — no AI charge", points: 0 },
    ],
    at: iso(days(-2)),
  },
  {
    id: "rcp_003",
    messageId: "msg_helio_44",
    projectId: "p_helio",
    projectName: "Helio Marketing",
    clerk: "engineer",
    modelRoute: "premium",
    modelRouteLabel: "Premium",
    taskType: "edit",
    taskTypeLabel: "Change button color",
    member: { id: "u_1", name: "Avery Vance" },
    estimatedRange: { min: 0.4, max: 0.7 },
    estimatedAt: iso(days(-3)),
    finalCharge: 0.5,
    status: "completed",
    firecrawlUsed: false,
    validationCompleted: true,
    durationMs: 6_800,
    lines: [
      { kind: "output_tokens", label: "Token edit", points: 0.5 },
    ],
    at: iso(days(-3)),
  },
  {
    id: "rcp_004",
    messageId: "msg_helio_45",
    projectId: "p_helio",
    projectName: "Helio Marketing",
    clerk: "engineer",
    modelRoute: "recommended",
    modelRouteLabel: "Standard",
    taskType: "edit",
    taskTypeLabel: "Add testimonial section",
    member: { id: "u_1", name: "Avery Vance" },
    estimatedRange: { min: 0.8, max: 1.4 },
    estimatedAt: iso(days(-4)),
    finalCharge: 0.7,
    status: "partial",
    firecrawlUsed: false,
    validationCompleted: true,
    durationMs: 18_400,
    lines: [
      { kind: "output_tokens", label: "Partial result — section drafted, copy pending", points: 0.7 },
    ],
    at: iso(days(-4)),
  },
];

const grants: PointGrant[] = [
  { id: "g_001", bucket: "monthly", amount: 40, grantedAt: iso(days(-12)), expiresAt: iso(days(18)), reason: "subscription_renewal" },
  { id: "g_002", bucket: "daily", amount: 5, grantedAt: iso(days(0)), expiresAt: iso(days(1)), reason: "daily_grant" },
  { id: "g_003", bucket: "promotional", amount: 2, grantedAt: iso(days(-9)), expiresAt: iso(days(21)), reason: "promo_signup" },
];

const ledger: PointLedgerEntry[] = [
  ...grants.map<PointLedgerEntry>((g) => ({ kind: "grant", id: g.id, at: g.grantedAt, grant: g })),
  ...receipts.map<PointLedgerEntry>((r) => ({
    kind: "charge", id: "le_" + r.id, at: r.at, receipt: r,
    deductedFrom: r.finalCharge === 0 ? [] : ["daily", "monthly"],
  })),
  { kind: "expiry", id: "le_exp_1", at: iso(days(-5)), bucket: "daily", amount: 1.2, reason: "daily_unused" },
];

const invoices: Invoice[] = [
  { id: "in_001", number: "CC-2026-0042", amountUsd: 9.99, status: "paid", issuedAt: iso(days(-12)), hostedUrl: "#", pdfUrl: "#" },
  { id: "in_002", number: "CC-2026-0028", amountUsd: 9.99, status: "paid", issuedAt: iso(days(-42)), hostedUrl: "#", pdfUrl: "#" },
  { id: "in_003", number: "CC-2026-0019", amountUsd: 14.99, status: "paid", issuedAt: iso(days(-58)), hostedUrl: "#", pdfUrl: "#" },
];

const members: Member[] = [
  { id: "u_1", name: "Avery Vance", email: "avery@nightowl.studio", role: "Owner", monthlyLimit: null, usedThisMonth: 8.2 },
  { id: "u_2", name: "Sasha Patel", email: "sasha@nightowl.studio", role: "Admin", monthlyLimit: 20, usedThisMonth: 12.1 },
  { id: "u_3", name: "Kai Nguyen", email: "kai@nightowl.studio", role: "Member", monthlyLimit: 10, usedThisMonth: 7.5 },
];

/* ===================== API ===================== */

export const billingApi = {
  async getSubscription(): Promise<SubscriptionStatus> { await wait(); return subscription; },
  async getBalance(): Promise<PointBalance> { await wait(); return balance; },
  async getLedger(filter?: { kind?: PointLedgerEntry["kind"]; projectId?: string; from?: string }): Promise<PointLedgerEntry[]> {
    await wait();
    let rows = [...ledger];
    if (filter?.kind) rows = rows.filter((r) => r.kind === filter.kind);
    if (filter?.projectId) rows = rows.filter((r) => r.kind === "charge" && r.receipt.projectId === filter.projectId);
    return rows.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  },
  async getUsage(groupBy: UsageGroupBy): Promise<UsageBucket[]> {
    await wait();
    const buckets = new Map<string, UsageBucket>();
    for (const r of receipts) {
      const key =
        groupBy === "project" ? r.projectId :
        groupBy === "member" ? r.member.id :
        groupBy === "modelRoute" ? r.modelRoute :
        r.taskType;
      const label =
        groupBy === "project" ? r.projectName :
        groupBy === "member" ? r.member.name :
        groupBy === "modelRoute" ? r.modelRoute :
        r.taskType;
      const existing = buckets.get(key);
      if (existing) existing.points += r.finalCharge;
      else buckets.set(key, { key, label, points: r.finalCharge });
    }
    return [...buckets.values()].sort((a, b) => b.points - a.points);
  },
  async getInvoices(): Promise<Invoice[]> { await wait(); return invoices; },
  async getMembers(): Promise<Member[]> { await wait(); return members; },
  async setMemberLimit(_id: string, _limit: number | null): Promise<void> { await wait(); },
  /** Server creates the real Stripe Checkout Session; client only redirects. */
  async startCheckout(planId: PlanId, cadence: Cadence): Promise<CheckoutSession> {
    await wait(420);
    return {
      id: "cs_test_" + Math.random().toString(36).slice(2, 10),
      url: `/checkout/cs_test_${planId}_${cadence}`,
      expiresAt: iso(days(0.02)),
      mode: "subscription",
      planId, cadence,
    };
  },
  async startTopup(topupId: TopUp["id"]): Promise<CheckoutSession> {
    await wait(420);
    return {
      id: "cs_test_" + Math.random().toString(36).slice(2, 10),
      url: `/checkout/cs_test_${topupId}`,
      expiresAt: iso(days(0.02)),
      mode: "payment",
      topupId,
    };
  },
  /** Server creates a Stripe Customer Portal session; never expose secrets. */
  async openCustomerPortal(): Promise<CustomerPortalSession> {
    await wait(380);
    return { id: "bps_mock", url: "/billing?portal=1", returnUrl: "/app/billing" };
  },
  /** Cancel-at-period-end — server is authoritative. */
  async cancelSubscription(): Promise<SubscriptionStatus> {
    await wait();
    return { ...subscription, cancelAtPeriodEnd: true };
  },
  async resumeSubscription(): Promise<SubscriptionStatus> {
    await wait();
    return { ...subscription, cancelAtPeriodEnd: false };
  },
};

/* ===================== Helpers ===================== */

export const SPEND_ORDER: PointBucket[] = ["daily", "promotional", "monthly", "rollover", "purchased"];

export const BUCKET_LABEL: Record<PointBucket, string> = {
  daily: "Daily",
  promotional: "Promotional",
  monthly: "Monthly",
  rollover: "Rollover",
  purchased: "Purchased",
};

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id)!;
}

export function planPrice(plan: Plan, cadence: Cadence): number {
  return cadence === "annual" ? plan.priceAnnual : plan.priceMonthly;
}
