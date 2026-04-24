'use client'

import { useState } from 'react'
import { MoreVertical, Trash, CalendarIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { deleteSession, updateSessionDate } from './actions'
import { useToast } from '@/components/ui/use-toast'

export function SessionActions({
  sessionId,
  initialDate,
  redirectOnDelete,
}: {
  sessionId: string
  initialDate: string
  redirectOnDelete?: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date(initialDate))
  const [isUpdatingDate, setIsUpdatingDate] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteSession(sessionId)
      toast({
        title: 'Session deleted',
        description: 'The workout session has been permanently deleted.',
      })
      if (redirectOnDelete) {
        router.push('/sessions')
      } else {
        setIsDeleteDialogOpen(false)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete session.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateDate = async () => {
    if (!date) return
    
    try {
      setIsUpdatingDate(true)
      await updateSessionDate(sessionId, date.toISOString())
      toast({
        title: 'Date updated',
        description: 'The session date has been updated.',
      })
      setIsDateDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update date.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingDate(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsDateDialogOpen(true)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>Change Date</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this workout session? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Session Date</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDateDialogOpen(false)} disabled={isUpdatingDate}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDate} disabled={isUpdatingDate || !date}>
              {isUpdatingDate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
