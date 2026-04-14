-- Migration: Add workout sessions and progression targets

-- 1. Create workout_sessions table
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add session_id to workouts table (nullable for backward compatibility)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL;

-- 3. Add progression target columns to machines table
ALTER TABLE machines ADD COLUMN IF NOT EXISTS target_sets INTEGER DEFAULT 3;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS target_reps INTEGER DEFAULT 10;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS weight_increment DECIMAL(5,2) DEFAULT 5.0;

-- 4. Enable RLS on workout_sessions
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for workout_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON workout_sessions;
CREATE POLICY "Users can view own sessions" ON workout_sessions 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON workout_sessions;
CREATE POLICY "Users can insert own sessions" ON workout_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON workout_sessions;
CREATE POLICY "Users can update own sessions" ON workout_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON workout_sessions;
CREATE POLICY "Users can delete own sessions" ON workout_sessions 
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workouts_session_id ON workouts(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(session_date DESC);
