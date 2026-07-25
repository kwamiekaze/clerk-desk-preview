
CREATE TABLE public.user_provider_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('openrouter','openai','anthropic','gemini','kimi')),
  api_key text NOT NULL,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_provider_keys TO authenticated;
GRANT ALL ON public.user_provider_keys TO service_role;

CREATE INDEX user_provider_keys_user_idx ON public.user_provider_keys(user_id);

ALTER TABLE public.user_provider_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_provider_keys_all_own" ON public.user_provider_keys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.profiles
  ADD COLUMN default_ai_provider text
  CHECK (default_ai_provider IN ('openrouter','openai','anthropic','gemini','kimi'));
