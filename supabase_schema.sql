-- =======================================================================
-- 11th MAN: REVISED SCHEMA (Aligned with Mobile App)
-- Run this in Supabase SQL Editor to reset and apply
-- =======================================================================

-- Clean up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
DROP TRIGGER IF EXISTS audit_matches ON public.matches;
DROP TRIGGER IF EXISTS audit_balls ON public.balls;
DROP TRIGGER IF EXISTS audit_requirements ON public.requirements;
DROP TRIGGER IF EXISTS audit_payments ON public.payments;
DROP FUNCTION IF EXISTS public.handle_new_user_registration() CASCADE;
DROP FUNCTION IF EXISTS public.process_audit_metadata() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_channels CASCADE;
DROP TABLE IF EXISTS public.balls CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.requirements CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS extra_type_enum CASCADE;

-- Enums
CREATE TYPE user_role_enum AS ENUM ('PLAYER', 'CAPTAIN', 'SUPER_ADMIN');
CREATE TYPE extra_type_enum AS ENUM ('none', 'wide', 'noball', 'byes', 'legbyes');

-- 1. Profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'Cricket Player',
    role user_role_enum DEFAULT 'PLAYER' NOT NULL,
    batting_style TEXT DEFAULT 'Right-Hand Bat' NOT NULL,
    bowling_style TEXT DEFAULT 'Right-Arm Fast' NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 2. Matches (simple string-based team names, like Rails app)
CREATE TABLE public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scorer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    team_a TEXT NOT NULL,
    team_b TEXT NOT NULL,
    team_a_score INTEGER DEFAULT 0 NOT NULL CHECK (team_a_score >= 0),
    team_b_score INTEGER DEFAULT 0 NOT NULL CHECK (team_b_score >= 0),
    team_a_wickets INTEGER DEFAULT 0 NOT NULL CHECK (team_a_wickets BETWEEN 0 AND 10),
    team_b_wickets INTEGER DEFAULT 0 NOT NULL CHECK (team_b_wickets BETWEEN 0 AND 10),
    total_overs INTEGER DEFAULT 20 NOT NULL CHECK (total_overs > 0),
    toss_winner TEXT,
    elected_to TEXT CHECK (elected_to IN ('bat', 'bowl')),
    status TEXT DEFAULT 'in_progress' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 3. Balls (ball-by-ball log)
CREATE TABLE public.balls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    inning_number INTEGER NOT NULL CHECK (inning_number IN (1, 2)),
    over_number INTEGER NOT NULL CHECK (over_number >= 1),
    ball_number INTEGER NOT NULL CHECK (ball_number BETWEEN 1 AND 6),
    runs INTEGER DEFAULT 0 NOT NULL CHECK (runs >= 0),
    extra_runs INTEGER DEFAULT 0 NOT NULL CHECK (extra_runs >= 0),
    extra_type extra_type_enum DEFAULT 'none' NOT NULL,
    wicket BOOLEAN DEFAULT FALSE NOT NULL,
    batter_name TEXT NOT NULL,
    bowler_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Requirements (Player Marketplace)
CREATE TABLE public.requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    role_needed TEXT NOT NULL,
    venue TEXT NOT NULL,
    match_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 5. Payments
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'pkr' NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =======================================================================
-- TRIGGER: Auto-create profile on signup (fault-tolerant)
-- =======================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username', 
            split_part(NEW.email, '@', 1) || '_' || substr(md5(random()::text), 1, 5)
        ),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Cricket Player'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role_enum, 'PLAYER'::user_role_enum)
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        username = COALESCE(profiles.username, EXCLUDED.username),
        full_name = COALESCE(NULLIF(profiles.full_name, 'Cricket Player'), EXCLUDED.full_name);
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- =======================================================================
-- RLS (Row Level Security)
-- =======================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper: get role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: users can see all, edit/insert only their own
CREATE POLICY "Profiles: public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: own insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Profiles: own update" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Matches: public read, only authenticated can insert
CREATE POLICY "Matches: public read" ON public.matches FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Matches: auth insert" ON public.matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Matches: scorer update" ON public.matches FOR UPDATE USING (scorer_id = auth.uid());

-- Balls: public read, only match scorer can insert/delete
CREATE POLICY "Balls: public read" ON public.balls FOR SELECT USING (true);
CREATE POLICY "Balls: auth insert" ON public.balls FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Balls: scorer delete" ON public.balls FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = balls.match_id AND matches.scorer_id = auth.uid()
  )
);

-- Requirements: public read, auth insert, owner update/delete
CREATE POLICY "Requirements: public read" ON public.requirements FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Requirements: auth insert" ON public.requirements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Requirements: owner update" ON public.requirements FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Requirements: owner delete" ON public.requirements FOR DELETE USING (user_id = auth.uid());

-- Payments: own only
CREATE POLICY "Payments: own read" ON public.payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Payments: own insert" ON public.payments FOR INSERT WITH CHECK (user_id = auth.uid());

-- =======================================================================
-- REALTIME
-- =======================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.balls;

-- =======================================================================
-- CHAT SYSTEM
-- =======================================================================
CREATE TABLE public.chat_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(sender_id, receiver_id)
);

CREATE TABLE public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channels: participants read" ON public.chat_channels FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Channels: users insert" ON public.chat_channels FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Channels: receiver update" ON public.chat_channels FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Messages: participants read" ON public.chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels c 
    WHERE c.id = channel_id AND (c.sender_id = auth.uid() OR c.receiver_id = auth.uid()) AND c.status = 'accepted'
  )
);
CREATE POLICY "Messages: sender insert" ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM public.chat_channels c 
    WHERE c.id = channel_id AND (c.sender_id = auth.uid() OR c.receiver_id = auth.uid()) AND c.status = 'accepted'
  )
);
CREATE POLICY "Messages: receiver update" ON public.chat_messages FOR UPDATE USING (
  auth.uid() != sender_id AND 
  EXISTS (
    SELECT 1 FROM public.chat_channels c 
    WHERE c.id = channel_id AND (c.sender_id = auth.uid() OR c.receiver_id = auth.uid())
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;

-- =======================================================================
-- AUDIT FIELDS (Requirement 04)
-- =======================================================================

-- 1. Add missing audit columns to all tables
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE public.matches 
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE public.balls 
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

ALTER TABLE public.requirements 
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

ALTER TABLE public.chat_channels 
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.process_audit_metadata()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- auth.uid() returns the authenticated user making the request
        NEW.created_by = auth.uid();
        NEW.updated_by = auth.uid();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
        
        -- Detect Soft Delete transition
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by = auth.uid();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach triggers to all tables
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.process_audit_metadata();

DROP TRIGGER IF EXISTS audit_matches ON public.matches;
CREATE TRIGGER audit_matches BEFORE INSERT OR UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.process_audit_metadata();

DROP TRIGGER IF EXISTS audit_balls ON public.balls;
CREATE TRIGGER audit_balls BEFORE INSERT OR UPDATE ON public.balls FOR EACH ROW EXECUTE FUNCTION public.process_audit_metadata();

DROP TRIGGER IF EXISTS audit_requirements ON public.requirements;
CREATE TRIGGER audit_requirements BEFORE INSERT OR UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION public.process_audit_metadata();

DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments BEFORE INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.process_audit_metadata();

DROP TRIGGER IF EXISTS audit_chat_channels ON public.chat_channels;
CREATE TRIGGER audit_chat_channels BEFORE INSERT OR UPDATE ON public.chat_channels FOR EACH ROW EXECUTE FUNCTION public.process_audit_metadata();

DROP TRIGGER IF EXISTS audit_chat_messages ON public.chat_messages;
CREATE TRIGGER audit_chat_messages BEFORE INSERT OR UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.process_audit_metadata();
