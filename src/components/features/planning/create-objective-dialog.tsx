"use client"

import { useState } from "react"
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
import type { ObjectiveCategory } from "@/types"

interface CreateObjectiveDialogProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  weekId: string
  onObjectiveCreated: (objective: any) => void
}

export function CreateObjectiveDialog({
  isOpen,
  onClose,
  productId,
  weekId,
  onObjectiveCreated,
}: CreateObjectiveDialogProps) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<ObjectiveCategory>("urgent-important")
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) return

    try {
      setLoading(true)

      // Simulate objective creation
      const newObjective = {
        id: `obj-${Date.now()}`,
        productId,
        weekId,
        title: title.trim(),
        progress: 0,
        tasks: [],
        category: category,
      }

      onObjectiveCreated(newObjective)
      onClose()
      setTitle("")
    } catch (error) {
      console.error("Error creating objective:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel objectif</DialogTitle>
          <DialogDescription>Définissez un objectif pour la semaine sélectionnée.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titre de l'objectif</Label>
            <Textarea
              id="title"
              placeholder="Décrivez l'objectif à atteindre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Catégorie</Label>
            <select
              id="category"
              className="w-full p-2 border rounded"
              value={category}
              onChange={(e) => setCategory(e.target.value as ObjectiveCategory)}
            >
              <option value="urgent-important">Urgent & Important</option>
              <option value="important-not-urgent">Important & Non Urgent</option>
              <option value="urgent-not-important">Urgent & Non Important</option>
              <option value="not-urgent-not-important">Standard</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" onClick={handleCreate} disabled={loading || !title.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
