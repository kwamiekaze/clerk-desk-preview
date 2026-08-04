# Plan: Keep Custom Domains on Tier A Only

You have chosen to skip the Cloudflare paid-plan setup for now, so Tier B (full HTTPS custom domains via CNAME) will not be active. This plan makes Tier A the clear, working path and ensures Tier B is gracefully unavailable instead of looking broken.

## What we will do

1. **Audit current custom-domain UI**
   - Read `src/components/builder/CustomDomainPanel.tsx` and `src/lib/ai/domains.functions.ts` to confirm the existing Tier A / Tier B split.
   - Verify that Tier B already falls back to a pending/"not active on this deployment" message when Cloudflare secrets are missing.

2. **Gate Tier B in the UI when Cloudflare secrets are absent**
   - Pass `fullDomainsAvailable: boolean` from the server to the panel (already returned by `listMyDomains`).
   - Keep Tier A fully visible and selectable.
   - Render Tier B as a disabled/locked card with copy explaining it requires a Cloudflare for SaaS paid plan and platform secrets, and that Tier A works today.

3. **Polish Tier A forwarding instructions**
   - Keep the existing GoDaddy-specific steps.
   - Add a short generic registrar fallback note.
   - Emphasize that the browser address bar will show `codingclerks.com/{slug}` after the redirect, not the user's domain.
   - Show the exact target URL for the current project slug.

4. **Server-side safety check**
   - Ensure `addDomain` rejects `mode: 'cname'` with a clear error if `fullDomainsAvailable` is false, rather than silently creating a pending row that never resolves. Tier A remains allowed.

5. **Typecheck and quick preview review**
   - Run `bun run build:dev`.
   - Smoke-test the panel on a published project to confirm Tier A instructions render and Tier B is clearly unavailable.

## Out of scope

- No Cloudflare secrets will be added.
- No Custom Hostnames API calls will be made.
- No changes to live preview, publish, GitHub, billing, BYOK providers, or admin.
