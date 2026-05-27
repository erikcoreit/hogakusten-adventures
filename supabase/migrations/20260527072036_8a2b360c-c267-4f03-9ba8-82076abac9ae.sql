DROP POLICY IF EXISTS "Users update own comment" ON public.comments;
CREATE POLICY "Users update own comment" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own rating" ON public.ratings;
CREATE POLICY "Users update own rating" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read adventure images" ON storage.objects;
CREATE POLICY "Public read adventure images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'adventure-images' AND (storage.foldername(name))[1] IS NOT NULL);