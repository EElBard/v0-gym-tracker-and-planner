import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { MachineForm } from '@/components/gym/machine-form'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditMachinePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch machine with muscle groups
  const { data: machine, error } = await supabase
    .from('machines')
    .select(`
      id,
      name,
      photo_pathname,
      notes,
      machine_muscle_groups (
        muscle_group_id,
        is_primary
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !machine) notFound()

  const formattedMachine = {
    id: machine.id,
    name: machine.name,
    notes: machine.notes,
    photo_pathname: machine.photo_pathname,
    muscle_groups: machine.machine_muscle_groups || [],
  }

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container px-4 md:px-6 mx-auto py-6 max-w-2xl">
        <div className="flex flex-col gap-6">
          <Link 
            href={`/machines/${id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to machine
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Machine</h1>
            <p className="text-muted-foreground">
              Update the details for {machine.name}
            </p>
          </div>
          <MachineForm machine={formattedMachine} />
        </div>
      </main>
    </div>
  )
}
