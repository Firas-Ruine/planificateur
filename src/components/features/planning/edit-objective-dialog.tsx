"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { Objective } from "@/types"

// Helper function to convert Firestore timestamp to Date
const convertToDate = (date: any): Date | null => {
  if (!date) return null

  // If it's already a Date object
  if (date instanceof Date) return date

  // If it's a Firestore timestamp (has seconds and nanoseconds)
  if (date && typeof date === "object" && "seconds" in date && "nanoseconds" in date) {
    return new Date(date.seconds * 1000)
  }

  // If it's a timestamp number
  if (typeof date === "number") {
    return new Date(date)
  }

  // If it's an ISO string
  if (typeof date === "string") {
    const parsedDate = new Date(date)
    return isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  return null
}

interface EditObjectiveDialogProps {
  objective: Objective | null
  isOpen: boolean
  onClose: () => void
  onSave: (
    objectiveId: string,
    title: string,
    isUrgent: boolean,
    isImportant: boolean,
    targetDate?: Date | null,
  ) => Promise<void>
}

export function EditObjectiveDialog({ objective, isOpen, onClose, onSave }: EditObjectiveDialogProps) {
  const [title, setTitle] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [isImportant, setIsImportant] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (objective) {
      setTitle(objective.title || "")
      setIsUrgent(objective.isUrgent || false)
      setIsImportant(objective.isImportant || false)

      // Convert the date if needed
      if (objective.targetCompletionDate) {
        const convertedDate = convertToDate(objective.targetCompletionDate)
        setDate(convertedDate || undefined)
      } else {
        setDate(undefined)
      }
    }
  }, [objective])

  const handleSave = async () => {
    if (!objective) return

    try {
      setSaving(true)
      await onSave(objective.id, title, isUrgent, isImportant, date)
      onClose()
    } catch (error) {
      console.error("Error saving objective:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleClearDate = () => {
    setDate(undefined)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'objectif</DialogTitle>
          <DialogDescription>
            Modifiez les détails de l'objectif. Cliquez sur Enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titre</Label>
            <Textarea
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'objectif"
              className="min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="urgent" checked={isUrgent} onCheckedChange={setIsUrgent} />
              <Label htmlFor="urgent">Urgent</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="important" checked={isImportant} onCheckedChange={setIsImportant} />
              <Label htmlFor="important">Important</Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="target-date">Date d'achèvement cible (TTM)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="target-date"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={cn("pointer-events-auto w-auto p-0")} align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={fr} />
                </PopoverContent>
              </Popover>
              {date && (
                <Button variant="ghost" size="icon" onClick={handleClearDate} className="shrink-0">
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
