/**
 * Typed mock data + service layer for CodingClerks.
 * All functions return Promises and simulate network latency.
 * Replace internals with real Supabase queries when wiring backend.
 */

export type ProjectStatus = "draft" | "building" | "preview" | "deployed" | "archived";
export type ProjectKind = "brief" | "clone";

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  kind: ProjectKind;
  status: ProjectStatus;
  folderId: string | null;
  thumbColor: "primary" | "secondary" | "warn" | "muted";
  pointsSpent: number;
  pointsEstimate: number;
  lastActivity: string; // ISO
  createdAt: string;
  preview: { url: string; ms: number } | null;
  repo: string | null;
};

export type Folder = {
  id: string;
  name: string;
  projectCount: number;
};

export type ActivityEvent = {
  id: string;
  projectId: string;
  projectName: string;
  clerk: "intake" | "crawler" | "designer" | "engineer" | "qa" | "preview" | "deploy";
  message: string;
  status: "ok" | "run" | "warn" | "idle";
  at: string;
  pointsDelta?: number;
};

export type Workspace = {
  id: string;
  name: string;
  plan: "Free" | "Starter" | "Builder" | "Pro";
  seats: number;
  initials: string;
  accent: "primary" | "secondary";
};

export type Account = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: "Owner" | "Member" | "Admin";
};

export type PointsBalance = {
  available: number;
  monthly: number;
  resetsAt: string;
};

export type OnboardingStep = {
  id: "verify" | "workspace" | "first_project" | "github" | "invite";
  title: string;
  description: string;
  done: boolean;
  href?: string;
};

export type ModelTier = "automatic" | "fast" | "recommended" | "premium";

export type NewProjectInput = {
  name: string;
  kind: ProjectKind;
  brief?: string;
  url?: string;
  model: ModelTier;
  maxBudget: number;
};

export type EstimateRange = { min: number; max: number; etaSec: number };
