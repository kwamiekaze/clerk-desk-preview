import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  callProvider,
  platformFallbackAvailable,
  PROVIDERS,
  PROVIDER_DEFAULT_MODEL,
  PROVIDER_LABEL,
  type ProviderId,
} from "./provider.server";

const ProviderEnum = z.enum(["openrouter", "openai", "anthropic", "gemini", "kimi"]);

export type KeyStatus = {
  provider: ProviderId;
  label: string;
  defaultModel: string;
  connected: boolean;
  model: string | null;
  updatedAt: string | null;
};

// ---------- getKeyStatuses ----------
export const getKeyStatuses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: rows }, { data: profile }] = await Promise.all([
      context.supabase
        .from("user_provider_keys")
        .select("provider,model,updated_at")
        .eq("user_id", context.userId),
      context.supabase
        .from("profiles")
        .select("default_ai_provider")
        .eq("id", context.userId)
        .maybeSingle(),
    ]);
    const byProv = new Map<string, { model: string | null; updated_at: string }>();
    for (const r of rows ?? []) byProv.set(r.provider, { model: r.model, updated_at: r.updated_at });
    const statuses: KeyStatus[] = PROVIDERS.map((p) => {
      const row = byProv.get(p);
      return {
        provider: p,
        label: PROVIDER_LABEL[p],
        defaultModel: PROVIDER_DEFAULT_MODEL[p],
        connected: Boolean(row),
        model: row?.model ?? null,
        updatedAt: row?.updated_at ?? null,
      };
    });
    return {
      statuses,
      defaultProvider: (profile?.default_ai_provider ?? null) as ProviderId | null,
      platformFallbackAvailable: platformFallbackAvailable(),
    };
  });

// ---------- saveProviderKey ----------
export const saveProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      provider: ProviderEnum,
      apiKey: z.string().min(10).max(500),
      model: z.string().max(200).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const apiKey = data.apiKey.trim();
    if (apiKey.length < 10) throw new Error("API key looks too short.");
    const model = data.model?.trim() || null;

    const { error } = await context.supabase
      .from("user_provider_keys")
      .upsert(
        {
          user_id: context.userId,
          provider: data.provider,
          api_key: apiKey,
          model,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" },
      );
    if (error) throw new Error(error.message);

    // If no default is set yet, adopt this provider as the default.
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("default_ai_provider")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile?.default_ai_provider) {
      await context.supabase
        .from("profiles")
        .update({ default_ai_provider: data.provider })
        .eq("id", context.userId);
    }
    return { ok: true };
  });

// ---------- removeProviderKey ----------
export const removeProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ provider: ProviderEnum }).parse)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_provider_keys")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", data.provider);
    if (error) throw new Error(error.message);

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("default_ai_provider")
      .eq("id", context.userId)
      .maybeSingle();
    if (profile?.default_ai_provider === data.provider) {
      await context.supabase
        .from("profiles")
        .update({ default_ai_provider: null })
        .eq("id", context.userId);
    }
    return { ok: true };
  });

// ---------- setDefaultProvider ----------
export const setDefaultProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ provider: ProviderEnum }).parse)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("user_provider_keys")
      .select("provider")
      .eq("user_id", context.userId)
      .eq("provider", data.provider)
      .maybeSingle();
    if (!row) throw new Error(`Save an ${PROVIDER_LABEL[data.provider]} key first, then set it as default.`);
    const { error } = await context.supabase
      .from("profiles")
      .update({ default_ai_provider: data.provider })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- testProviderKey ----------
export const testProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ provider: ProviderEnum }).parse)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("user_provider_keys")
      .select("api_key,model")
      .eq("user_id", context.userId)
      .eq("provider", data.provider)
      .maybeSingle();
    if (!row?.api_key) return { ok: false, message: "No key saved for this provider." };
    try {
      const out = await callProvider(
        data.provider,
        row.api_key,
        (row.model && row.model.trim()) || PROVIDER_DEFAULT_MODEL[data.provider],
        "Reply with the single word OK.",
        [{ role: "user", content: "ping" }],
        { maxTokens: 5 },
      );
      return { ok: true, message: out.trim().slice(0, 40) || "OK" };
    } catch (e) {
      return { ok: false, message: (e as Error).message.slice(0, 240) };
    }
  });
