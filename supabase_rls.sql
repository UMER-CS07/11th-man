-- Enable RLS on core tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;

-- Helper function to securely check user roles without infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Everyone can read (Select)
CREATE POLICY "Public Read Access" ON public.teams FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public Read Access" ON public.matches FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public Read Access" ON public.requirements FOR SELECT USING (deleted_at IS NULL);

-- Only Captains and Super Admins can Insert or Update
CREATE POLICY "Captains Insert Teams" ON public.teams FOR INSERT WITH CHECK (public.get_user_role() IN ('CAPTAIN', 'SUPER_ADMIN'));
CREATE POLICY "Captains Update Teams" ON public.teams FOR UPDATE USING (public.get_user_role() IN ('CAPTAIN', 'SUPER_ADMIN'));

CREATE POLICY "Captains Insert Matches" ON public.matches FOR INSERT WITH CHECK (public.get_user_role() IN ('CAPTAIN', 'SUPER_ADMIN'));
CREATE POLICY "Captains Update Matches" ON public.matches FOR UPDATE USING (public.get_user_role() IN ('CAPTAIN', 'SUPER_ADMIN'));

CREATE POLICY "Captains Insert Requirements" ON public.requirements FOR INSERT WITH CHECK (public.get_user_role() IN ('CAPTAIN', 'SUPER_ADMIN'));
