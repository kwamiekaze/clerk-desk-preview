ALTER TABLE public.usage_events ADD COLUMN IF NOT EXISTS tokens_used integer NOT NULL DEFAULT 0;
ALTER TABLE public.usage_events ADD COLUMN IF NOT EXISTS is_platform_fallback boolean NOT NULL DEFAULT true;

DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conname, con.conrelid::regclass::text AS tbl
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public'
      AND con.contype = 'c'
      AND (
        (rel.relname = 'user_provider_keys' AND pg_get_constraintdef(con.oid) ILIKE '%provider%')
        OR (rel.relname = 'profiles' AND pg_get_constraintdef(con.oid) ILIKE '%default_ai_provider%')
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
  END LOOP;
END $$;

ALTER TABLE public.user_provider_keys
  ADD CONSTRAINT user_provider_keys_provider_check
  CHECK (provider IN ('openrouter','openai','anthropic','gemini','kimi','glm','qwen','deepseek'));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_ai_provider_check
  CHECK (default_ai_provider IN ('openrouter','openai','anthropic','gemini','kimi','glm','qwen','deepseek'));

CREATE TABLE public.custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  mode text NOT NULL DEFAULT 'forwarding' CHECK (mode IN ('forwarding','cname')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','active','error')),
  cloudflare_hostname_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_domains TO authenticated;
GRANT ALL ON public.custom_domains TO service_role;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_domains_all_own" ON public.custom_domains FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX custom_domains_domain_idx ON public.custom_domains(domain);
CREATE INDEX custom_domains_project_idx ON public.custom_domains(project_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $fn$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_custom_domains_updated_at BEFORE UPDATE ON public.custom_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();