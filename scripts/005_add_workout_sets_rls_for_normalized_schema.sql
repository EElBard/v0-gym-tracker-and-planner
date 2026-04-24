-- Adds missing RLS policies for workout_sets in the normalized schema
-- where workout_sets links to workout_exercises via exercise_id.

BEGIN;

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout sets" ON public.workout_sets;
CREATE POLICY "Users can view own workout sets" ON public.workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = workout_sets.exercise_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own workout sets" ON public.workout_sets;
CREATE POLICY "Users can insert own workout sets" ON public.workout_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = workout_sets.exercise_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own workout sets" ON public.workout_sets;
CREATE POLICY "Users can update own workout sets" ON public.workout_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = workout_sets.exercise_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = workout_sets.exercise_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own workout sets" ON public.workout_sets;
CREATE POLICY "Users can delete own workout sets" ON public.workout_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workout_sessions s ON s.id = we.session_id
      WHERE we.id = workout_sets.exercise_id
        AND s.user_id = auth.uid()
    )
  );

COMMIT;
