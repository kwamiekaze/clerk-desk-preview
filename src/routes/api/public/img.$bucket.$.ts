import { createFileRoute } from "@tanstack/react-router";

// Public proxy that streams objects from private storage buckets.
// /api/public/img/{bucket}/{objectPath...}
export const Route = createFileRoute("/api/public/img/$bucket/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const bucket = params.bucket;
        if (bucket !== "project-images" && bucket !== "avatars") {
          return new Response("Not found", { status: 404 });
        }
        const splat = (params as { _splat?: string })._splat ?? "";
        const path = splat.replace(/^\/+/, "").replace(/\.\./g, "");
        if (!path) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
