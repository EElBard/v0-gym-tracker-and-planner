-- Normalize workout data model:
-- workout_sessions -> workout_exercises -> workout_sets
-- This migration is backward-compatible with legacy workouts/workout_id data.

BEGIN;

-- 1) Create workout_exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Add exercise_id to workout_sets
ALTER TABLE public.workout_sets
  ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES public.workout_exercises(id) ON DELETE CASCADE;

-- 3) Backfill missing workout_sessions for legacy workouts
DO $$
DECLARE
  legacy_workout RECORD;
  created_session_id UUID;
BEGIN
  FOR legacy_workout IN
    SELECT id, user_id, workout_date, notes, created_at
    FROM public.workouts
    WHERE session_id IS NULL
  LOOP
    INSERT INTO public.workout_sessions (user_id, session_date, notes, created_at, updated_at)
    VALUES (
      legacy_workout.user_id,
      legacy_workout.workout_date,
      legacy_workout.notes,
      legacy_workout.created_at,
      legacy_workout.created_at
    )
    RETURNING id INTO created_session_id;

    UPDATE public.workouts
    SET session_id = created_session_id
    WHERE id = legacy_workout.id;
  END LOOP;
END $$;

-- 4) Backfill workout_exercises from legacy workouts
INSERT INTO public.workout_exercises (session_id, machine_id, display_order, created_at, updated_at)
SELECT
  w.session_id,
  w.machine_id,
  0,
  w.created_at,
  w.created_at
FROM public.workouts w
LEFT JOIN public.workout_exercises we
  ON we.session_id = w.session_id
 AND we.machine_id = w.machine_id
 AND we.display_order = 0
WHERE w.session_id IS NOT NULL
  AND we.id IS NULL;

-- 5) Backfill workout_sets.exercise_id
UPDATE public.workout_sets ws
SET exercise_id = we.id
FROM public.workouts w
JOIN public.workout_exercises we
  ON we.session_id = w.session_id
 AND we.machine_id = w.machine_id
WHERE ws.workout_id = w.id
  AND ws.exercise_id IS NULL;

-- 6) Enable RLS on workout_exercises
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.workout_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can insert own workout exercises" ON public.workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workout_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can update own workout exercises" ON public.workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.workout_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can delete own workout exercises" ON public.workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.workout_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

-- 7) Replace workout_sets RLS policies to support BOTH legacy and normalized references
DROP POLICY IF EXISTS "Users can view own workout sets" ON public.workout_sets;
CREATE POLICY "Users can view own workout sets" ON public.workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_id
        AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = exercise_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own workout sets" ON public.workout_sets;
CREATE POLICY "Users can insert own workout sets" ON public.workout_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_id
        AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = exercise_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own workout sets" ON public.workout_sets;
CREATE POLICY "Users can update own workout sets" ON public.workout_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_id
        AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = exercise_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_id
        AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = exercise_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own workout sets" ON public.workout_sets;
CREATE POLICY "Users can delete own workout sets" ON public.workout_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_id
        AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = exercise_id
        AND s.user_id = auth.uid()
    )
  );

-- 8) Indexes
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session_id ON public.workout_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_machine_id ON public.workout_exercises(machine_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON public.workout_sets(exercise_id);

COMMIT;
