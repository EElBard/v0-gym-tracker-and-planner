-- Create workout_sessions table
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add session_id to workouts table (nullable for backward compatibility)
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL;

-- Add progression target columns to machines table
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS target_sets INTEGER DEFAULT 3;
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS target_reps INTEGER DEFAULT 10;
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS weight_increment DECIMAL(5,2) DEFAULT 5.0;
