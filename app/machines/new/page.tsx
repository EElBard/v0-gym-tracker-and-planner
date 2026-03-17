import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { MachineForm } from '@/components/gym/machine-form'

export default async function NewMachinePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container py-6 max-w-2xl">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold">Add New Machine</h1>
            <p className="text-muted-foreground">
              Add a gym machine or exercise to your library
            </p>
          </div>
          <MachineForm />
        </div>
      </main>
    </div>
  )
}
