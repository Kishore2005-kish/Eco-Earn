
-- Create rewards/marketplace table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  points_cost INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT -1,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards"
ON public.rewards FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage rewards"
ON public.rewards FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create redemptions table to track user purchases
CREATE TABLE public.redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.rewards(id),
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
ON public.redemptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions"
ON public.redemptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions"
ON public.redemptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update redemptions"
ON public.redemptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to redeem a reward (atomic: check points, deduct, record)
CREATE OR REPLACE FUNCTION public.redeem_reward(p_user_id UUID, p_reward_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_stock INTEGER;
  v_points INTEGER;
BEGIN
  SELECT points_cost, stock INTO v_cost, v_stock FROM rewards WHERE id = p_reward_id AND is_active = true;
  IF v_cost IS NULL THEN RETURN 'Reward not found'; END IF;
  IF v_stock = 0 THEN RETURN 'Out of stock'; END IF;

  SELECT points INTO v_points FROM profiles WHERE id = p_user_id;
  IF v_points < v_cost THEN RETURN 'Not enough points'; END IF;

  UPDATE profiles SET points = points - v_cost, updated_at = now() WHERE id = p_user_id;
  IF v_stock > 0 THEN UPDATE rewards SET stock = stock - 1 WHERE id = p_reward_id; END IF;
  INSERT INTO redemptions (user_id, reward_id, points_spent) VALUES (p_user_id, p_reward_id, v_cost);

  RETURN 'success';
END;
$$;
