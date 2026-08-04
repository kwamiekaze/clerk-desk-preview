import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DomainSchema = z
  .string()
  .min(4)
  .max(253)
  .transform((d) => d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, ""))
  .refine((d) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d), "Enter a valid domain, e.g. www.example.com");

function cloudflareEnv(): { token: string; zoneId: string } | null {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) return null;
  return { token, zoneId };
}

function appHost(): string {
  const raw = process.env.PUBLIC_APP_URL || "https://codingclerks.com";
  try {
    return new URL(raw).host;
  } catch {
    return "codingclerks.com";
  }
}

async function cf(path: string, init: RequestInit, token: string) {
  const resp = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const json = (await resp.json().catch(() => ({}))) as {
    success?: boolean;
    result?: Record<string, unknown>;
    errors?: Array<{ message?: string }>;
  };
  if (!resp.ok || json.success === false) {
    const msg = json.errors?.map((e) => e.message).filter(Boolean).join("; ") || `Cloudflare error ${resp.status}`;
    throw new Error(msg);
  }
  return json.result ?? {};
}

// ---------- listMyDomains ----------
export const listMyDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ projectId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("custom_domains")
      .select("id,domain,mode,status,error_message,created_at,updated_at")
      .eq("project_id", data.projectId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      domains: rows ?? [],
      fullDomainsAvailable: Boolean(cloudflareEnv()),
      appHost: appHost(),
    };
  });

// ---------- addDomain ----------
export const addDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      domain: DomainSchema,
      mode: z.enum(["forwarding", "cname"]),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { data: site } = await context.supabase
      .from("published_sites")
      .select("id,slug")
      .eq("project_id", data.projectId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!site) throw new Error("Publish this project first, then connect a domain.");

    const { data: existing } = await context.supabase
      .from("custom_domains")
      .select("id")
      .eq("domain", data.domain)
      .maybeSingle();
    if (existing) throw new Error("That domain is already connected.");

    const env = cloudflareEnv();
    let hostnameId: string | null = null;
    let status: "pending" | "verified" | "active" | "error" = "pending";
    let errorMessage: string | null = null;
    let cnameTarget: string | null = null;
    let note: string | null = null;

    if (data.mode === "cname") {
      if (!env) {
        throw new Error(
          "Full custom domains (CNAME) require a Cloudflare for SaaS paid plan and Cloudflare API credentials. Use Quick redirect instead, or contact support to enable full custom domains."
        );
      }
      try {
        const result = await cf(
          `/zones/${env.zoneId}/custom_hostnames`,
          {
            method: "POST",
            body: JSON.stringify({
              hostname: data.domain,
              ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } },
            }),
          },
          env.token,
        );
        hostnameId = typeof result.id === "string" ? result.id : null;
        cnameTarget = appHost();
        note =
          "Add a CNAME record at your registrar pointing this hostname at the target below. In this MVP, full custom domains work for subdomains (e.g. www.example.com); for an apex/root domain, use your registrar's own \u201cforward apex to www\u201d rule plus this CNAME on the www record.";
      } catch (e) {
        status = "error";
        errorMessage = (e as Error).message.slice(0, 400);
      }
    }

    const { data: row, error } = await context.supabase
      .from("custom_domains")
      .insert({
        user_id: context.userId,
        project_id: data.projectId,
        domain: data.domain,
        mode: data.mode,
        status,
        cloudflare_hostname_id: hostnameId,
        error_message: errorMessage,
      })
      .select("id,domain,mode,status,error_message,created_at,updated_at")
      .single();
    if (error) throw new Error(error.message);

    return {
      domain: row,
      slug: site.slug,
      forwardTarget: `https://${appHost()}/${site.slug}`,
      cname: cnameTarget ? { host: data.domain, target: cnameTarget } : null,
      note,
    };
  });

// ---------- removeDomain ----------
export const removeDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ domainId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("custom_domains")
      .select("id,cloudflare_hostname_id")
      .eq("id", data.domainId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!row) throw new Error("Domain not found.");

    const env = cloudflareEnv();
    if (row.cloudflare_hostname_id && env) {
      try {
        await cf(
          `/zones/${env.zoneId}/custom_hostnames/${row.cloudflare_hostname_id}`,
          { method: "DELETE" },
          env.token,
        );
      } catch {
        /* local row still gets removed */
      }
    }

    const { error } = await context.supabase
      .from("custom_domains")
      .delete()
      .eq("id", data.domainId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- checkDomainStatus ----------
export const checkDomainStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ domainId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("custom_domains")
      .select("id,domain,mode,status,cloudflare_hostname_id")
      .eq("id", data.domainId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!row) throw new Error("Domain not found.");

    if (row.mode === "forwarding") {
      return {
        status: row.status,
        message:
          "Redirects are handled at your registrar, so there's nothing for us to verify \u2014 open your domain in a browser to test it.",
      };
    }

    const env = cloudflareEnv();
    if (!env || !row.cloudflare_hostname_id) {
      return { status: row.status, message: "Full custom domains aren't active on this deployment yet." };
    }

    try {
      const result = await cf(
        `/zones/${env.zoneId}/custom_hostnames/${row.cloudflare_hostname_id}`,
        { method: "GET" },
        env.token,
      );
      const hostStatus = String(result.status ?? "pending");
      const ssl = (result.ssl ?? {}) as { status?: string };
      const isActive = hostStatus === "active" && ssl.status === "active";
      const next: "pending" | "verified" | "active" = isActive
        ? "active"
        : hostStatus === "active"
          ? "verified"
          : "pending";
      await context.supabase
        .from("custom_domains")
        .update({ status: next, error_message: null, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      return {
        status: next,
        message: isActive
          ? "Live \u2014 certificate issued and the domain is serving your site."
          : `Waiting on DNS and certificate validation (hostname: ${hostStatus}, ssl: ${ssl.status ?? "pending"}).`,
      };
    } catch (e) {
      const msg = (e as Error).message.slice(0, 400);
      await context.supabase
        .from("custom_domains")
        .update({ status: "error", error_message: msg, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      return { status: "error" as const, message: msg };
    }
  });
