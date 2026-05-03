
-- Create submission status enum
CREATE TYPE public.submission_status AS ENUM ('approved', 'review', 'rejected');

-- Create waste type enum
CREATE TYPE public.waste_type AS ENUM ('plastic', 'metal', 'paper', 'organic', 'glass', 'ewaste', 'unknown');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  last_recycled_at TIMESTAMP WITH TIME ZONE,
  total_kg_recycled NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bins table
CREATE TABLE public.bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  qr_code_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  waste_type public.waste_type NOT NULL DEFAULT 'unknown',
  confidence NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  bin_id TEXT REFERENCES public.bins(bin_id),
  status public.submission_status NOT NULL DEFAULT 'review',
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app_role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles (for leaderboard), update their own
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Bins: anyone can read
CREATE POLICY "Anyone can read bins" ON public.bins FOR SELECT USING (true);

-- Submissions: users can read own, insert own
CREATE POLICY "Users can read own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: users can read own
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Seed some demo bins
INSERT INTO public.bins (bin_id, name, location_lat, location_lng, qr_code_data) VALUES
  ('BIN-001', 'Central Park Bin', 40.785091, -73.968285, '{"binId":"BIN-001","location":"Central Park"}'),
  ('BIN-002', 'Times Square Bin', 40.758896, -73.985130, '{"binId":"BIN-002","location":"Times Square"}'),
  ('BIN-003', 'Brooklyn Bridge Bin', 40.706086, -73.996864, '{"binId":"BIN-003","location":"Brooklyn Bridge"}');
