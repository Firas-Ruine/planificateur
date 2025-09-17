"use client"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import type { Objective, Task, Member } from "@/types"
import { ProgressBar } from "@/components/progress-bar"
import { DraggableTaskList } from "@/components/features/planning/draggable-task-list"

interface DraggableObjectiveProps {
  objective: Objective
  teamMembers: Member[]
  onDeleteObjective: (objectiveId: string) => Promise<void>
  onEditObjective: (objective: Objective) => void
  onAddTask: () => void
  onDeleteTask: (objectiveId: string, taskId: string) => Promise<void>
  onToggleTaskCompletion: (objectiveId: string, taskId: string) => Promise<void>
  onEditTask: (task: Task) => void
  onTasksReordered: (objectiveId: string, tasks: Task[]) => Promise<void>
  index: number // Add index prop for numbering
}

export function DraggableObjective({
  objective,
  teamMembers,
  onDeleteObjective,
  onEditObjective,
  onAddTask,
  onDeleteTask,
  onToggleTaskCompletion,
  onEditTask,
  onTasksReordered,
  index, // Use index for numbering
}: DraggableObjectiveProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: objective.id,
    data: {
      type: "objective",
      objective: objective,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border rounded ${isDragging ? "border-indigo-500 bg-indigo-50" : "hover:bg-gray-50"}`}
    >
      <div className="flex items-start">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 mr-2 text-gray-400 hover:text-gray-600 touch-manipulation rounded-md hover:bg-gray-100"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-6 w-6" />
        </div>

        {/* Add objective number */}
        <div className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm mr-2 flex-shrink-0">
          {index + 1}
        </div>

        <div className="flex-grow">
          <div className="flex justify-between">
            <h3 className="font-medium text-gray-800">{objective.title}</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditObjective(objective)}
                className="text-indigo-500 hover:text-indigo-700 transition-colors p-1"
                aria-label="Modifier l'objectif"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={() => onDeleteObjective(objective.id)}
                className="text-red-500 hover:text-red-700 transition-colors p-1"
                aria-label="Supprimer l'objectif"
              >
                ×
              </button>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{objective.tasks.length} tâches</span>
              <span>{objective.progress}% complété</span>
            </div>
            <ProgressBar progress={objective.progress} />
          </div>

          <div className="mt-3">
            <DraggableTaskList
              tasks={objective.tasks}
              objectiveId={objective.id}
              teamMembers={teamMembers}
              onDeleteTask={onDeleteTask}
              onToggleTaskCompletion={onToggleTaskCompletion}
              onEditTask={onEditTask}
              onTasksReordered={(tasks) => onTasksReordered(objective.id, tasks)}
            />

            <button
              onClick={onAddTask}
              className="mt-2 w-full text-sm text-indigo-600 hover:text-indigo-800 border border-dashed border-indigo-300 hover:border-indigo-500 rounded p-2 transition-colors"
            >
              + Ajouter une tâche
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
