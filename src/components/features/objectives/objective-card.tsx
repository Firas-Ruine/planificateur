"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/progress-bar"
import { Flag, Trash2, Edit, Copy } from "lucide-react"
import type { Objective } from "@/types"
import { deleteObjective } from "@/services/firebase-service"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { EditObjectiveDialog } from "@/components/features/planning/edit-objective-dialog"
import { FlagObjectiveDialog } from "@/components/features/planning/flag-objective-dialog"
import { CloneObjectiveDialog } from "@/components/features/planning/clone-objective-dialog"
import { useToast } from "@/hooks/use-toast"

interface ObjectiveCardProps {
  objective: Objective
  onClick: () => void
  onDeleted: (objectiveId: string) => void
  onUpdated?: (objective: Objective) => void
  dataMode?: "firebase" | "mock" | "loading"
}

export function ObjectiveCard({ objective, onClick, onDeleted, onUpdated, dataMode = "firebase" }: ObjectiveCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false)
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteObjective(objective.id)
      onDeleted(objective.id)
      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé avec succès.",
      })
    } catch (error) {
      console.error("Error deleting objective:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'objectif.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleSave = async (
    objectiveId: string,
    title: string,
    isUrgent: boolean,
    isImportant: boolean,
    targetDate?: Date | null,
  ) => {
    // This function is passed to the EditObjectiveDialog
    // The dialog will handle the actual update
    if (onUpdated) {
      onUpdated({
        ...objective,
        title,
        isUrgent,
        isImportant,
        targetCompletionDate: targetDate,
      })
    }
  }

  const handleCloneSuccess = (clonedObjectiveId: string) => {
    toast({
      title: "Objectif cloné",
      description: "L'objectif a été cloné avec succès.",
    })
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardContent className="flex-grow pt-6" onClick={onClick}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex-grow">
              <h3 className="text-lg font-semibold line-clamp-2">{objective.title}</h3>
            </div>
            {objective.flag?.isFlagged && (
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                <Flag className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                Signalé
              </Badge>
            )}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progression</span>
              <span>{objective.progress}%</span>
            </div>
            <ProgressBar value={objective.progress} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {objective.isUrgent && (
              <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100">
                Urgent
              </Badge>
            )}
            {objective.isImportant && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                Important
              </Badge>
            )}
            {objective.targetCompletionDate && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                Date cible: {new Date(objective.targetCompletionDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4 pb-4 flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditDialogOpen(true)
              }}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Modifier</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsFlagDialogOpen(true)
              }}
            >
              <Flag className={`h-4 w-4 ${objective.flag?.isFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
              <span className="sr-only">Signaler</span>
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsCloneDialogOpen(true)
              }}
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Cloner</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                setIsDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Supprimer</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'objectif"
        description="Êtes-vous sûr de vouloir supprimer cet objectif ? Cette action ne peut pas être annulée."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isDeleting}
      />

      <EditObjectiveDialog
        objective={objective}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSave}
      />

      <FlagObjectiveDialog
        objective={objective}
        isOpen={isFlagDialogOpen}
        onClose={() => setIsFlagDialogOpen(false)}
        onObjectiveUpdated={onUpdated}
      />

      <CloneObjectiveDialog
        objective={objective}
        isOpen={isCloneDialogOpen}
        onClose={() => setIsCloneDialogOpen(false)}
        dataMode={dataMode}
        onSuccess={handleCloneSuccess}
      />
    </>
  )
}
