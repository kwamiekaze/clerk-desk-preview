import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("id,email,plan,role,display_name,avatar_url")
      .eq("id", context.userId)
      .maybeSingle();
    return data ?? null;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      display_name: z.string().max(80).optional().nullable(),
      avatar_url: z.string().max(500).optional().nullable(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const patch: { display_name?: string | null; avatar_url?: string | null } = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name || null;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url || null;
    const { error } = await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
