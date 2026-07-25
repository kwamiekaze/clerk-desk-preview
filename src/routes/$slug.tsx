import { createFileRoute } from "@tanstack/react-router";
import { notFoundHtml, serveSlugPath } from "@/lib/serve-published";

export const Route = createFileRoute("/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        return serveSlugPath(params.slug, "index.html").catch(
          () => new Response(notFoundHtml(params.slug), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }),
        );
      },
    },
  },
});
