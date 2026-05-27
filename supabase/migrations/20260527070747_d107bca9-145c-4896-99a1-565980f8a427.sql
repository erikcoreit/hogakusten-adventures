
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id uuid NOT NULL REFERENCES public.micro_adventures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (adventure_id, user_id)
);

GRANT SELECT ON public.ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads ratings on published" ON public.ratings FOR SELECT
USING (EXISTS (SELECT 1 FROM public.micro_adventures a WHERE a.id = adventure_id AND a.status = 'published'));
CREATE POLICY "Auth insert own rating" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own rating" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own rating" ON public.ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id uuid NOT NULL REFERENCES public.micro_adventures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads comments on published" ON public.comments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.micro_adventures a WHERE a.id = adventure_id AND a.status = 'published'));
CREATE POLICY "Auth insert own comment" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comment" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comment" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Moderators delete any comment" ON public.comments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ratings_adventure ON public.ratings(adventure_id);
CREATE INDEX idx_comments_adventure ON public.comments(adventure_id, created_at DESC);
