"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { MemberSelect } from "@/components/member-select"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import type { Task, Member } from "@/types"

interface EditTaskDialogProps {
  task: Task | null
  objectiveId: string | null
  teamMembers: Member[]
  isOpen: boolean
  onClose: () => void
  onSave: (objectiveId: string, taskId: string, updatedTask: Partial<Task>) => Promise<void>
}

export function EditTaskDialog({ task, objectiveId, teamMembers, isOpen, onClose, onSave }: EditTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [assignee, setAssignee] = useState<string | null>(null)
  const [complexity, setComplexity] = useState("medium")
  const [criticality, setCriticality] = useState("medium")
  const [isSaving, setIsSaving] = useState(false)
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Reset form and sync internal state when task, objectiveId, or isOpen changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setAssignee(task.assignee)
      setComplexity(task.complexity)
      setCriticality(task.criticality)
    }
    setInternalIsOpen(isOpen)
  }, [task, objectiveId, isOpen])

  const handleClose = () => {
    setInternalIsOpen(false)
    onClose()
  }

  const handleSave = async () => {
    if (!task || !objectiveId || !title.trim()) return

    try {
      setIsSaving(true)
      await onSave(objectiveId, task.id, {
        title,
        assignee,
        complexity,
        criticality,
      })
      setInternalIsOpen(false)
      onClose()
    } catch (error) {
      console.error("Error saving task:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    // This would be implemented to handle the actual deletion
    // For now, we just close the confirmation dialog
    setIsDeleteConfirmOpen(false)
  }

  // If no task or objectiveId is provided, don't render the dialog
  if (!task || !objectiveId) {
    return null
  }

  return (
    <>
      <Dialog open={internalIsOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px] w-[calc(100%-2rem)] p-4 sm:p-6 bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Modifier la tâche</DialogTitle>
            <DialogDescription className="text-gray-600">
              Modifiez les détails de la tâche. Cliquez sur Enregistrer lorsque vous avez terminé.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3 sm:gap-4 sm:py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title" className="text-gray-700">
                Titre de la tâche
              </Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Décrivez la tâche à réaliser"
                className="bg-white text-gray-900 border-gray-300"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-assignee" className="text-gray-700">
                Membre assigné
              </Label>
              <MemberSelect
                members={teamMembers}
                value={assignee}
                onChange={setAssignee}
                placeholder="Sélectionner un membre"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="task-complexity" className="text-gray-700">
                  Complexité
                </Label>
                <select
                  id="task-complexity"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  className="w-full p-2 border rounded bg-white text-gray-900 border-gray-300"
                >
                  <option value="low">Facile</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-criticality" className="text-gray-700">
                  Criticité
                </Label>
                <select
                  id="task-criticality"
                  value={criticality}
                  onChange={(e) => setCriticality(e.target.value)}
                  className="w-full p-2 border rounded bg-white text-gray-900 border-gray-300"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-2 mt-4 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Supprimer
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer la tâche"
        description={`Êtes-vous sûr de vouloir supprimer cette tâche : "${task.title}" ? Cette action ne peut pas être annulée.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isDestructive={true}
      />
    </>
  )
}
