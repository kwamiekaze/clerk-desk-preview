import { createFileRoute } from "@tanstack/react-router";
import { notFoundHtml, serveSlugPath } from "@/lib/serve-published";

export const Route = createFileRoute("/$slug/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as { _splat?: string })._splat ?? "";
        const path = splat.replace(/^\/+/, "").replace(/\.\./g, "") || "index.html";
        return serveSlugPath(params.slug, path).catch(
          () => new Response(notFoundHtml(params.slug), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }),
        );
      },
    },
  },
});
