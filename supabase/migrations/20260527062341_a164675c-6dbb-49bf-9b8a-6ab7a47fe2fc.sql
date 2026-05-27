
-- Enums
CREATE TYPE public.app_role AS ENUM ('contributor', 'moderator', 'admin');
CREATE TYPE public.adventure_status AS ENUM ('draft', 'pending', 'published', 'rejected', 'archived');
CREATE TYPE public.adventure_difficulty AS ENUM ('latt', 'medel', 'utmanande');
CREATE TYPE public.tag_kind AS ENUM ('category', 'tag');
CREATE TYPE public.report_status AS ENUM ('open', 'resolved', 'dismissed');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'contributor');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- adventure_tags
CREATE TABLE public.adventure_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label_sv TEXT NOT NULL,
  label_en TEXT NOT NULL,
  kind public.tag_kind NOT NULL DEFAULT 'tag',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.adventure_tags TO anon, authenticated;
GRANT ALL ON public.adventure_tags TO service_role;
ALTER TABLE public.adventure_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags readable by all" ON public.adventure_tags FOR SELECT USING (true);
CREATE POLICY "Admins manage tags" ON public.adventure_tags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- micro_adventures
CREATE TABLE public.micro_adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  duration_minutes INTEGER,
  difficulty public.adventure_difficulty NOT NULL DEFAULT 'latt',
  season TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  status public.adventure_status NOT NULL DEFAULT 'draft',
  rejection_note TEXT,
  language TEXT NOT NULL DEFAULT 'sv',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ma_status ON public.micro_adventures(status);
CREATE INDEX idx_ma_author ON public.micro_adventures(author_id);
GRANT SELECT ON public.micro_adventures TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.micro_adventures TO authenticated;
GRANT ALL ON public.micro_adventures TO service_role;
ALTER TABLE public.micro_adventures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published readable by all" ON public.micro_adventures FOR SELECT USING (status = 'published');
CREATE POLICY "Author reads own" ON public.micro_adventures FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Moderators read all" ON public.micro_adventures FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Author inserts own draft/pending" ON public.micro_adventures FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND status IN ('draft', 'pending'));
CREATE POLICY "Author updates own draft/rejected" ON public.micro_adventures FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status IN ('draft', 'rejected'))
  WITH CHECK (author_id = auth.uid() AND status IN ('draft', 'pending'));
CREATE POLICY "Moderators update all" ON public.micro_adventures FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Author deletes own draft" ON public.micro_adventures FOR DELETE TO authenticated USING (author_id = auth.uid() AND status = 'draft');
CREATE POLICY "Admins delete all" ON public.micro_adventures FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ma_updated_at BEFORE UPDATE ON public.micro_adventures FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- adventure_tag_links
CREATE TABLE public.adventure_tag_links (
  adventure_id UUID NOT NULL REFERENCES public.micro_adventures(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.adventure_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, tag_id)
);
GRANT SELECT ON public.adventure_tag_links TO anon, authenticated;
GRANT INSERT, DELETE ON public.adventure_tag_links TO authenticated;
GRANT ALL ON public.adventure_tag_links TO service_role;
ALTER TABLE public.adventure_tag_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Links readable by all" ON public.adventure_tag_links FOR SELECT USING (true);
CREATE POLICY "Author manages own links" ON public.adventure_tag_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.micro_adventures m WHERE m.id = adventure_id AND (m.author_id = auth.uid() OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.micro_adventures m WHERE m.id = adventure_id AND (m.author_id = auth.uid() OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'))));

-- favorites
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adventure_id UUID NOT NULL REFERENCES public.micro_adventures(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, adventure_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.micro_adventures(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users read own reports" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Mods update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('adventure-images', 'adventure-images', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Adventure images public read" ON storage.objects FOR SELECT USING (bucket_id = 'adventure-images');
CREATE POLICY "Users upload own adventure images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'adventure-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own adventure images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'adventure-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own adventure images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'adventure-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed tags
INSERT INTO public.adventure_tags (slug, label_sv, label_en, kind) VALUES
  ('vandring', 'Vandring', 'Hiking', 'category'),
  ('kajak', 'Kajak', 'Kayaking', 'category'),
  ('cykel', 'Cykel', 'Cycling', 'category'),
  ('bad', 'Bad', 'Swimming', 'category'),
  ('skidor', 'Skidor', 'Skiing', 'category'),
  ('barnvanligt', 'Barnvänligt', 'Kid-friendly', 'tag'),
  ('hundvanligt', 'Hundvänligt', 'Dog-friendly', 'tag'),
  ('utan_bil', 'Utan bil', 'Car-free', 'tag'),
  ('utsikt', 'Utsikt', 'Viewpoint', 'tag'),
  ('eldplats', 'Eldplats', 'Fire pit', 'tag'),
  ('nara_centrum', 'Nära centrum', 'Near city', 'tag'),
  ('rullstol', 'Rullstolsvänligt', 'Wheelchair accessible', 'tag');
