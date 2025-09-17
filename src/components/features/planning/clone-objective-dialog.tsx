"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { Objective } from "@/types"
import { cloneObjective } from "@/services/firebase-service"
import { cloneMockObjective } from "@/services/mock-data-service"
import { getCurrentWeekId, getWeekRange, getWeekId } from "@/lib/week-utils"
import { addWeeks, subWeeks } from "date-fns"

interface CloneObjectiveDialogProps {
  isOpen: boolean
  onClose: () => void
  objective: Objective | null
  dataMode?: "firebase" | "mock" | "loading"
  onSuccess?: (clonedObjectiveId: string) => void
}

export function CloneObjectiveDialog({ isOpen, onClose, objective, dataMode = "firebase", onSuccess }: CloneObjectiveDialogProps) {
  const [targetWeek, setTargetWeek] = useState<string>("")
  const [availableWeeks, setAvailableWeeks] = useState<{ id: string; label: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate available weeks (current week + 4 weeks before and after)
  useEffect(() => {
    if (isOpen) {
      const currentDate = new Date()
      const weeks = []

      // Add 4 weeks before current week
      for (let i = -4; i <= 4; i++) {
        const weekDate = i < 0 ? subWeeks(currentDate, Math.abs(i)) : addWeeks(currentDate, i)
        const weekId = getWeekId(weekDate)
        const { startDate, endDate } = getWeekRange(weekDate)

        const startFormatted = startDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
        const endFormatted = endDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })

        weeks.push({
          id: weekId,
          label: `${startFormatted} - ${endFormatted}${i === 0 ? " (Semaine actuelle)" : ""}`,
        })
      }

      setAvailableWeeks(weeks)

      // Set default target week to current week
      if (!targetWeek) {
        setTargetWeek(getCurrentWeekId())
      }
    }
  }, [isOpen, targetWeek])

  const handleClone = async () => {
    if (!objective || !targetWeek) return

    setIsLoading(true)
    setError(null)

    try {
      let clonedObjectiveId: string | null = null

      if (dataMode === "mock") {
        clonedObjectiveId = await cloneMockObjective(objective.id, targetWeek)
      } else {
        clonedObjectiveId = await cloneObjective(objective.id, targetWeek)
      }

      if (!clonedObjectiveId) {
        throw new Error("Failed to clone objective - no ID returned")
      }

      if (onSuccess) {
        onSuccess(clonedObjectiveId)
      }

      onClose()
    } catch (err) {
      console.error("Error cloning objective:", err)
      setError("Une erreur est survenue lors du clonage de l'objectif. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen && objective !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cloner l'objectif</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <h3 className="font-medium mb-2">Objectif à cloner:</h3>
          <p className="text-sm text-gray-700 mb-4">{objective?.title}</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="target-week" className="text-sm font-medium">
                Semaine cible:
              </label>
              <Select value={targetWeek} onValueChange={setTargetWeek}>
                <SelectTrigger id="target-week">
                  <SelectValue placeholder="Sélectionner une semaine" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map((week) => (
                    <SelectItem key={week.id} value={week.id}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleClone} disabled={isLoading || !targetWeek}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clonage...
              </>
            ) : (
              "Cloner"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
