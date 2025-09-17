"use client"

import type React from "react"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import type { Task, Member } from "@/types"
import { ComplexityBadge } from "@/components/complexity-badge"
import { CriticalityBadge } from "@/components/criticality-badge"
import { memo } from "react"

interface DraggableTaskProps {
  task: Task
  objectiveId: string
  teamMembers: Member[]
  onDeleteTask: (objectiveId: string, taskId: string) => Promise<void>
  onToggleTaskCompletion: (objectiveId: string, taskId: string) => Promise<void>
  onEditTask: (task: Task) => void
  isMobile?: boolean
  index: number // Add index prop for numbering
}

export const DraggableTask = memo(function DraggableTask({
  task,
  objectiveId,
  teamMembers,
  onDeleteTask,
  onToggleTaskCompletion,
  onEditTask,
  isMobile = false,
  index, // Use index for numbering
}: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 0,
    position: isDragging ? "relative" : "static",
    pointerEvents: isDragging ? "none" : "auto",
    willChange: "transform, opacity",
    touchAction: isMobile ? "none" : "auto", // Prevent scrolling on touch devices during drag
  } as React.CSSProperties

  const assignedMember = task.assignee ? teamMembers.find((m) => m.id === task.assignee) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded p-3 transition-all duration-200 draggable-item ${isDragging ? "border-indigo-500 bg-indigo-50 shadow-md" : ""}`}
    >
      <div className="flex items-start">
        <div
          {...attributes}
          {...listeners}
          className="draggable-handle cursor-grab active:cursor-grabbing p-2 mr-2 text-gray-400 hover:text-gray-600 mt-1 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Add task number */}
        <div className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full font-medium text-sm mr-2 flex-shrink-0">
          {index + 1}
        </div>

        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleTaskCompletion(objectiveId, task.id)}
          className="mt-1.5 h-4 w-4 mr-3"
          onClick={(e) => e.stopPropagation()} // Prevent drag when clicking checkbox
        />

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <p className={`text-base mb-3 ${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
              {task.title}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation() // Prevent drag when clicking button
                  onEditTask(task)
                }}
                className="text-indigo-500 hover:text-indigo-700 transition-colors p-1"
                aria-label="Modifier la tâche"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation() // Prevent drag when clicking button
                  onDeleteTask(objectiveId, task.id)
                }}
                className="text-red-500 hover:text-red-700 transition-colors p-1"
                aria-label="Supprimer la tâche"
              >
                ×
              </button>
            </div>
          </div>

          {assignedMember && (
            <div className="mb-3 flex items-center">
              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                <img
                  src={assignedMember.avatar || "/placeholder.svg"}
                  alt={assignedMember.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm text-gray-600">{assignedMember.name}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <ComplexityBadge complexity={task.complexity} className="text-xs" />
            <CriticalityBadge criticality={task.criticality} className="text-xs" />
          </div>
        </div>
      </div>
    </div>
  )
})
