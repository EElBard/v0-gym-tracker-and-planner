'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to delete session')
  }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')
}

export async function updateSessionDate(sessionId: string, newDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('workout_sessions')
    .update({ session_date: newDate })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to update session date')
  }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')
  revalidatePath(`/workouts/${sessionId}`)
}
