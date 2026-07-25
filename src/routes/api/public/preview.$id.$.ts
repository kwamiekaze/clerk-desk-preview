import { createFileRoute } from "@tanstack/react-router";

// Public preview endpoint. Serves project_files by project uuid.
// UUID acts as an unguessable capability token, similar to how Vercel preview URLs work.
export const Route = createFileRoute("/api/public/preview/$id/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        // uuid v4 shape check to avoid arbitrary lookups
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          return new Response("Not found", { status: 404 });
        }
        const splat = (params as { _splat?: string })._splat ?? "";
        const path = (splat === "" ? "index.html" : splat).replace(/^\/+/, "").replace(/\.\./g, "");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("project_files")
          .select("content")
          .eq("project_id", id)
          .eq("path", path)
          .maybeSingle();
        if (error || !data) return new Response("Not found", { status: 404 });

        const type = path.endsWith(".html") || !path.includes(".")
          ? "text/html; charset=utf-8"
          : path.endsWith(".css")
            ? "text/css; charset=utf-8"
            : path.endsWith(".js")
              ? "application/javascript; charset=utf-8"
              : path.endsWith(".json")
                ? "application/json; charset=utf-8"
                : "text/plain; charset=utf-8";

        return new Response(data.content, {
          status: 200,
          headers: {
            "content-type": type,
            "cache-control": "no-store",
            "x-frame-options": "SAMEORIGIN",
          },
        });
      },
    },
  },
});
