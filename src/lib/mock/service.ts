/**
 * Typed mock service. Each call returns a Promise with simulated latency.
 * Replace each function body with a real call (Supabase, server fn) later;
 * the signatures are intentionally stable.
 */
import { activity, folders, onboarding, points, projects, workspaces, account } from "./data";
import type {
  Account,
  ActivityEvent,
  EstimateRange,
  Folder,
  ModelTier,
  NewProjectInput,
  OnboardingStep,
  PointsBalance,
  Project,
  Workspace,
} from "./types";

const wait = (ms = 320) => new Promise((r) => setTimeout(r, ms));

export const mockApi = {
  // session / account
  async getAccount(): Promise<Account> {
    await wait(120);
    return account;
  },
  async listWorkspaces(): Promise<Workspace[]> {
    await wait(120);
    return workspaces;
  },
  async getPoints(): Promise<PointsBalance> {
    await wait(120);
    return points;
  },
  async getOnboarding(): Promise<OnboardingStep[]> {
    await wait(180);
    return onboarding;
  },

  // projects
  async listProjects(opts?: {
    search?: string;
    folderId?: string | null;
    status?: Project["status"] | "all";
    sort?: "recent" | "name" | "points";
  }): Promise<Project[]> {
    await wait(240);
    let rows = [...projects];
    if (opts?.folderId && opts.folderId !== "all") {
      rows = rows.filter((p) => p.folderId === opts.folderId);
    }
    if (opts?.status && opts.status !== "all") {
      rows = rows.filter((p) => p.status === opts.status);
    }
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      rows = rows.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }
    switch (opts?.sort) {
      case "name":
        rows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "points":
        rows.sort((a, b) => b.pointsSpent - a.pointsSpent);
        break;
      default:
        rows.sort((a, b) => +new Date(b.lastActivity) - +new Date(a.lastActivity));
    }
    return rows;
  },
  async getRecentProjects(limit = 4): Promise<Project[]> {
    await wait(180);
    return [...projects]
      .filter((p) => p.status !== "archived")
      .sort((a, b) => +new Date(b.lastActivity) - +new Date(a.lastActivity))
      .slice(0, limit);
  },
  async listFolders(): Promise<Folder[]> {
    await wait(120);
    return folders;
  },
  async archiveProject(_id: string): Promise<void> {
    await wait(220);
  },
  async duplicateProject(_id: string): Promise<{ id: string }> {
    await wait(260);
    return { id: "p_new_" + Math.random().toString(36).slice(2, 7) };
  },
  async deleteProject(_id: string): Promise<void> {
    await wait(220);
  },

  // activity
  async getRecentActivity(limit = 8): Promise<ActivityEvent[]> {
    await wait(180);
    return [...activity].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, limit);
  },

  // creation
  estimate(input: { kind: NewProjectInput["kind"]; model: ModelTier; budget: number }): EstimateRange {
    const baseMin = input.kind === "clone" ? 14 : 8;
    const baseMax = input.kind === "clone" ? 40 : 28;
    const mult = input.model === "premium" ? 1.8 : input.model === "fast" ? 0.6 : input.model === "recommended" ? 1.15 : 1;
    return {
      min: Math.round(baseMin * mult),
      max: Math.min(Math.round(baseMax * mult), input.budget),
      etaSec: input.model === "premium" ? 32 : input.model === "fast" ? 9 : 14,
    };
  },
  async createProject(input: NewProjectInput): Promise<{ id: string }> {
    await wait(420);
    return { id: "p_new_" + input.name.toLowerCase().replace(/\s+/g, "-").slice(0, 12) };
  },

  // auth (presentation only; real auth wires later)
  async signIn(_email: string, _password: string): Promise<{ ok: true }> {
    await wait(420);
    return { ok: true };
  },
  async signUp(_email: string, _password: string): Promise<{ ok: true; needsVerification: true }> {
    await wait(420);
    return { ok: true, needsVerification: true };
  },
  async sendReset(_email: string): Promise<{ ok: true }> {
    await wait(380);
    return { ok: true };
  },
  async oauthStart(_provider: "github"): Promise<{ ok: true }> {
    await wait(260);
    return { ok: true };
  },
};
