
-- Create has_role function if it doesn't exist
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- Drop existing insert policy on submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.submissions;

-- New policy: users can insert own, admins can insert for anyone
CREATE POLICY "Users or admins can insert submissions"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);
