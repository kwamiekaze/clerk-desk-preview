import { createFileRoute } from "@tanstack/react-router";

// Public preview endpoint. Serves project_files by project uuid.
// UUID acts as an unguessable capability token, similar to how Vercel preview URLs work.
// Adding ?bridge=1 injects a small error-forwarding script into HTML responses
// so the workspace iframe can surface runtime errors. Never used on published sites.
const BRIDGE_SCRIPT = `
<script>
(function(){
  function send(type, message){
    try { parent.postMessage({source:'codingclerks', type: type, message: String(message).slice(0, 500)}, '*'); } catch(e){}
  }
  window.addEventListener('error', function(e){ send('error', (e.error && e.error.message) || e.message || 'error'); }, true);
  window.addEventListener('unhandledrejection', function(e){ send('error', (e.reason && (e.reason.message || e.reason.toString())) || 'unhandled promise'); });
})();
</script>`;

export const Route = createFileRoute("/api/public/preview/$id/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = params.id;
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

        const isHtml = path.endsWith(".html") || !path.includes(".");
        const type = isHtml
          ? "text/html; charset=utf-8"
          : path.endsWith(".css")
            ? "text/css; charset=utf-8"
            : path.endsWith(".js")
              ? "application/javascript; charset=utf-8"
              : path.endsWith(".json")
                ? "application/json; charset=utf-8"
                : "text/plain; charset=utf-8";

        const url = new URL(request.url);
        const wantBridge = url.searchParams.get("bridge") === "1";
        let body = data.content;
        if (isHtml && wantBridge) {
          if (/<\/body>/i.test(body)) body = body.replace(/<\/body>/i, BRIDGE_SCRIPT + "</body>");
          else body = body + BRIDGE_SCRIPT;
        }

        return new Response(body, {
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

