
-- Create increment_points function for atomic updates
CREATE OR REPLACE FUNCTION public.increment_points(p_user_id UUID, p_pts INTEGER, p_kg NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak INTEGER;
  v_last TIMESTAMP WITH TIME ZONE;
  v_new_points INTEGER;
  v_new_level INTEGER;
BEGIN
  SELECT streak, last_recycled_at, points INTO v_streak, v_last, v_new_points
  FROM profiles WHERE id = p_user_id;

  -- Update streak
  IF v_last IS NULL OR (now() - v_last) > interval '48 hours' THEN
    v_streak := 1;
  ELSIF (now() - v_last) > interval '20 hours' THEN
    v_streak := v_streak + 1;
  END IF;

  v_new_points := v_new_points + p_pts;

  -- Calculate level
  v_new_level := CASE
    WHEN v_new_points < 50 THEN 1
    WHEN v_new_points < 150 THEN 2
    WHEN v_new_points < 350 THEN 3
    WHEN v_new_points < 700 THEN 4
    WHEN v_new_points < 1200 THEN 5
    WHEN v_new_points < 2000 THEN 6
    WHEN v_new_points < 3500 THEN 7
    WHEN v_new_points < 5500 THEN 8
    WHEN v_new_points < 8000 THEN 9
    ELSE 10
  END;

  UPDATE profiles SET
    points = v_new_points,
    level = v_new_level,
    streak = v_streak,
    total_kg_recycled = total_kg_recycled + p_kg,
    last_recycled_at = now(),
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Revoke direct execution from public users (only call via edge function or service role)
REVOKE EXECUTE ON FUNCTION public.increment_points FROM public;
REVOKE EXECUTE ON FUNCTION public.increment_points FROM anon;

-- Allow authenticated users to call it
GRANT EXECUTE ON FUNCTION public.increment_points TO authenticated;

-- Create storage bucket for waste images
INSERT INTO storage.buckets (id, name, public) VALUES ('waste-images', 'waste-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload waste images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'waste-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view waste images"
ON storage.objects FOR SELECT
USING (bucket_id = 'waste-images');
