-- Gym Tracker Database Schema

-- 0. muscle_groups - Reference table for muscle groups
CREATE TABLE IF NOT EXISTS muscle_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

-- Seed muscle groups
INSERT INTO muscle_groups (id, name, display_order) VALUES
  ('chest', 'Chest', 1),
  ('back', 'Back', 2),
  ('shoulders', 'Shoulders', 3),
  ('biceps', 'Biceps', 4),
  ('triceps', 'Triceps', 5),
  ('forearms', 'Forearms', 6),
  ('core', 'Core', 7),
  ('quads', 'Quads', 8),
  ('hamstrings', 'Hamstrings', 9),
  ('glutes', 'Glutes', 10),
  ('calves', 'Calves', 11)
ON CONFLICT (id) DO NOTHING;

-- 1. machines - User's gym machines/exercises
CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_pathname TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1b. machine_muscle_groups - Junction table for machines to muscle groups
CREATE TABLE IF NOT EXISTS machine_muscle_groups (
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  muscle_group_id TEXT NOT NULL REFERENCES muscle_groups(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  PRIMARY KEY (machine_id, muscle_group_id)
);

-- 2. workouts - Individual workout sessions
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. workout_sets - Individual sets within a workout
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_lbs DECIMAL(6,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for machines
DROP POLICY IF EXISTS "Users can view own machines" ON machines;
CREATE POLICY "Users can view own machines" ON machines 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own machines" ON machines;
CREATE POLICY "Users can insert own machines" ON machines 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own machines" ON machines;
CREATE POLICY "Users can update own machines" ON machines 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own machines" ON machines;
CREATE POLICY "Users can delete own machines" ON machines 
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for machine_muscle_groups (based on machine ownership)
DROP POLICY IF EXISTS "Users can view own machine muscle groups" ON machine_muscle_groups;
CREATE POLICY "Users can view own machine muscle groups" ON machine_muscle_groups 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM machines WHERE machines.id = machine_id AND machines.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own machine muscle groups" ON machine_muscle_groups;
CREATE POLICY "Users can insert own machine muscle groups" ON machine_muscle_groups 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM machines WHERE machines.id = machine_id AND machines.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own machine muscle groups" ON machine_muscle_groups;
CREATE POLICY "Users can delete own machine muscle groups" ON machine_muscle_groups 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM machines WHERE machines.id = machine_id AND machines.user_id = auth.uid())
  );

-- RLS Policies for workouts
DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
CREATE POLICY "Users can view own workouts" ON workouts 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
CREATE POLICY "Users can insert own workouts" ON workouts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
CREATE POLICY "Users can update own workouts" ON workouts 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;
CREATE POLICY "Users can delete own workouts" ON workouts 
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for workout_sets (based on workout ownership)
DROP POLICY IF EXISTS "Users can view own workout sets" ON workout_sets;
CREATE POLICY "Users can view own workout sets" ON workout_sets 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_id AND workouts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own workout sets" ON workout_sets;
CREATE POLICY "Users can insert own workout sets" ON workout_sets 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_id AND workouts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own workout sets" ON workout_sets;
CREATE POLICY "Users can delete own workout sets" ON workout_sets 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_id AND workouts.user_id = auth.uid())
  );

-- Allow public read access to muscle_groups reference table
DROP POLICY IF EXISTS "Anyone can read muscle groups" ON muscle_groups;
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read muscle groups" ON muscle_groups 
  FOR SELECT USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_machines_user_id ON machines(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_machine_id ON workouts(machine_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON workout_sets(workout_id);
