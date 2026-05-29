
DROP POLICY IF EXISTS "Auth insert own comment" ON public.comments;
CREATE POLICY "Auth insert own comment"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.micro_adventures a
    WHERE a.id = comments.adventure_id
      AND a.status = 'published'::adventure_status
  )
);

DROP POLICY IF EXISTS "Auth insert own rating" ON public.ratings;
CREATE POLICY "Auth insert own rating"
ON public.ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.micro_adventures a
    WHERE a.id = ratings.adventure_id
      AND a.status = 'published'::adventure_status
  )
);
