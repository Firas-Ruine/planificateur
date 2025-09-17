"use client"

import type React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CheckCircle2, GripVertical } from "lucide-react"
import type { Task, Member } from "@/types"
import { memo } from "react"
import { ComplexityBadge } from "@/components/complexity-badge"
import { CriticalityBadge } from "@/components/criticality-badge"

interface DashboardTaskProps {
  task: Task
  assignee: Member | null
  isMobile?: boolean
  index: number // Add index prop for numbering
}

export const DashboardTask = memo(function DashboardTask({
  task,
  assignee,
  isMobile = false,
  index, // Use index for numbering
}: DashboardTaskProps) {
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
    position: "relative", // Always use relative positioning
    pointerEvents: isDragging ? "none" : "auto",
    willChange: "transform, opacity",
    touchAction: "none", // Prevent scrolling on touch devices during drag
  } as React.CSSProperties

  if (!assignee) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 draggable-item ${
        isDragging ? "bg-indigo-50 border border-indigo-200 shadow-md" : "border hover:bg-gray-50"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="draggable-handle cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Add task number */}
      <div className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full font-medium text-sm flex-shrink-0">
        {index + 1}
      </div>

      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
        <img src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-grow">
        <div className="flex items-center gap-2">
          {task.completed ? (
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
          )}
          <span className={task.completed ? "text-gray-500" : "text-gray-700"}>{task.title}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{assignee.name}</p>

        {/* Complexity and criticality badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          <ComplexityBadge complexity={task.complexity} className="text-xs py-0.5 px-1.5" />
          <CriticalityBadge criticality={task.criticality} className="text-xs py-0.5 px-1.5" />
        </div>
      </div>
    </div>
  )
})
