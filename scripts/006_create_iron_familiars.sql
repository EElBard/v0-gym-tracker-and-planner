-- Migration 006: Create IronFamiliars Pet System Tables & RLS Policies

-- Create user_pets table
CREATE TABLE IF NOT EXISTS public.user_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL DEFAULT 'Ignis',
  species TEXT NOT NULL DEFAULT 'dragon',
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create pets alias table for backwards compatibility
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL DEFAULT 'Ignis',
  species TEXT NOT NULL DEFAULT 'dragon',
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_pets
DROP POLICY IF EXISTS "Users can view own user_pets" ON public.user_pets;
CREATE POLICY "Users can view own user_pets" ON public.user_pets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_pets" ON public.user_pets;
CREATE POLICY "Users can insert own user_pets" ON public.user_pets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_pets" ON public.user_pets;
CREATE POLICY "Users can update own user_pets" ON public.user_pets FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own user_pets" ON public.user_pets;
CREATE POLICY "Users can delete own user_pets" ON public.user_pets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pets
DROP POLICY IF EXISTS "Users can view own pets" ON public.pets;
CREATE POLICY "Users can view own pets" ON public.pets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pets" ON public.pets;
CREATE POLICY "Users can insert own pets" ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pets" ON public.pets;
CREATE POLICY "Users can update own pets" ON public.pets FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pets" ON public.pets;
CREATE POLICY "Users can delete own pets" ON public.pets FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_pets_user_id ON public.user_pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON public.pets(user_id);
