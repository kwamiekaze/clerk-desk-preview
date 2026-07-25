
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS github_repo text;

CREATE TABLE IF NOT EXISTS public.user_secrets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_token text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_secrets TO authenticated;
GRANT ALL ON public.user_secrets TO service_role;
ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_secrets_own_select" ON public.user_secrets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_secrets_own_insert" ON public.user_secrets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_secrets_own_update" ON public.user_secrets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_secrets_own_delete" ON public.user_secrets FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.published_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  published_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.published_sites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_sites TO authenticated;
GRANT ALL ON public.published_sites TO service_role;
ALTER TABLE public.published_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published_sites_public_read" ON public.published_sites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "published_sites_owner_insert" ON public.published_sites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "published_sites_owner_update" ON public.published_sites FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "published_sites_owner_delete" ON public.published_sites FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.published_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.published_sites(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text NOT NULL DEFAULT '',
  UNIQUE (site_id, path)
);
GRANT SELECT ON public.published_files TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_files TO authenticated;
GRANT ALL ON public.published_files TO service_role;
ALTER TABLE public.published_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published_files_public_read" ON public.published_files FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "published_files_owner_all" ON public.published_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.published_sites s WHERE s.id = published_files.site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.published_sites s WHERE s.id = published_files.site_id AND s.user_id = auth.uid()));

-- storage.objects policies (buckets already created via tool)
CREATE POLICY "project_images_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'project-images');
CREATE POLICY "project_images_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "project_images_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "project_images_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
