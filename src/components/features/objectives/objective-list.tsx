"use client"

import { useState, useEffect } from "react"
import { getObjectives } from "@/services/firebase-service"
import type { Objective } from "@/types"
import { ObjectiveCard } from "./objective-card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { CreateObjectiveDialog } from "@/components/features/planning/create-objective-dialog"
import { EditObjectiveDialog } from "@/components/features/planning/edit-objective-dialog"

interface ObjectiveListProps {
  productId: string
  weekId: string
}

export function ObjectiveList({ productId, weekId }: ObjectiveListProps) {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null)

  useEffect(() => {
    async function loadObjectives() {
      try {
        setLoading(true)
        setError(null)
        const data = await getObjectives(productId, weekId)
        setObjectives(data)
      } catch (err) {
        console.error("Error loading objectives:", err)
        setError("Failed to load objectives. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadObjectives()
  }, [productId, weekId])

  const handleCreateObjective = () => {
    setIsCreateDialogOpen(true)
  }

  const handleObjectiveCreated = (newObjective: Objective) => {
    setObjectives((prev) => [...prev, newObjective])
  }

  const handleObjectiveUpdated = (updatedObjective: Objective) => {
    setObjectives((prev) => prev.map((obj) => (obj.id === updatedObjective.id ? updatedObjective : obj)))
  }

  const handleObjectiveDeleted = (objectiveId: string) => {
    setObjectives((prev) => prev.filter((obj) => obj.id !== objectiveId))
  }

  if (loading) {
    return <div>Loading objectives...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Objectives ({objectives.length})</h2>
        <Button onClick={handleCreateObjective} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Objective
        </Button>
      </div>

      {objectives.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-500">No objectives found for this week.</p>
          <Button onClick={handleCreateObjective} variant="outline" className="mt-4">
            Create your first objective
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {objectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              onClick={() => setSelectedObjective(objective)}
              onDeleted={handleObjectiveDeleted}
            />
          ))}
        </div>
      )}

      <CreateObjectiveDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        productId={productId}
        weekId={weekId}
        onObjectiveCreated={handleObjectiveCreated}
      />

      {selectedObjective && (
        <EditObjectiveDialog
          isOpen={!!selectedObjective}
          onClose={() => setSelectedObjective(null)}
          objective={selectedObjective}
          onObjectiveUpdated={handleObjectiveUpdated}
          onObjectiveDeleted={handleObjectiveDeleted}
        />
      )}
    </div>
  )
}
