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
import { Loader2 } from "lucide-react"
import type { Flag } from "@/types"

interface FlagObjectiveDialogProps {
  isOpen: boolean
  onClose: () => void
  objectiveId: string
  currentFlag: Flag | undefined
  onSaveFlag: (objectiveId: string, flagDescription: string) => Promise<void>
  onRemoveFlag: (objectiveId: string) => Promise<void>
}

export function FlagObjectiveDialog({
  isOpen,
  onClose,
  objectiveId,
  currentFlag,
  onSaveFlag,
  onRemoveFlag,
}: FlagObjectiveDialogProps) {
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if (currentFlag && currentFlag.description) {
      setDescription(currentFlag.description)
    } else {
      setDescription("")
    }
  }, [currentFlag, isOpen])

  const handleSave = async () => {
    if (!description.trim()) return

    try {
      setSaving(true)
      await onSaveFlag(objectiveId, description.trim())
      onClose()
    } catch (error) {
      console.error("Error saving flag:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    try {
      setRemoving(true)
      await onRemoveFlag(objectiveId)
      onClose()
    } catch (error) {
      console.error("Error removing flag:", error)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] w-full">
        <DialogHeader>
          <DialogTitle>Marquer l'objectif</DialogTitle>
          <DialogDescription>
            Ajoutez une note pour indiquer que cet objectif nécessite une attention particulière.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="flag-description">Description du marquage</Label>
            <Textarea
              id="flag-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Besoin de clarification, Risque potentiel, À revoir..."
              className="min-h-[100px] w-full"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {currentFlag?.isFlagged && (
              <Button variant="destructive" onClick={handleRemove} disabled={saving || removing} className="mr-2">
                {removing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  "Supprimer le marquage"
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving || removing}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || removing || !description.trim()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
