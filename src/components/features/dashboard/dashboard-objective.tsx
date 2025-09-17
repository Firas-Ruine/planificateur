"use client"

import type React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, CalendarIcon, AlertTriangle, Star, X, Check, Flag } from "lucide-react"
import type { Objective } from "@/types"
import { ProgressBar } from "@/components/progress-bar"
import { memo } from "react"
import { format, isValid } from "date-fns"
import { fr } from "date-fns/locale"

interface DashboardObjectiveProps {
  objective: Objective
  isSelected: boolean
  onSelect: (objective: Objective) => void
  isMobile?: boolean
  index: number // Add index prop for numbering
}

export const DashboardObjective = memo(function DashboardObjective({
  objective,
  isSelected,
  onSelect,
  isMobile = false,
  index, // Use index for numbering
}: DashboardObjectiveProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: objective.id,
    data: {
      type: "objective",
      objective,
    },
  })

  // Safely format the target completion date with validation
  let formattedDate: string | null = null

  if (objective.targetCompletionDate) {
    try {
      // Handle different possible date formats
      let dateValue: Date

      if (objective.targetCompletionDate instanceof Date) {
        dateValue = objective.targetCompletionDate
      } else if (typeof objective.targetCompletionDate === "object" && objective.targetCompletionDate.toDate) {
        // Handle Firestore Timestamp objects
        dateValue = objective.targetCompletionDate.toDate()
      } else {
        // Handle string or number timestamps
        dateValue = new Date(objective.targetCompletionDate)
      }

      // Validate the date before formatting
      if (isValid(dateValue)) {
        formattedDate = format(dateValue, "PPP", { locale: fr })
      } else {
        console.warn("Invalid date value:", objective.targetCompletionDate)
      }
    } catch (error) {
      console.error("Error formatting date:", error, objective.targetCompletionDate)
      // Keep formattedDate as null if there's an error
    }
  }

  // Check if the objective is flagged
  const isFlagged = objective.flag?.isFlagged || false

  // Update the style object to prevent position changes during drag
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 draggable-item ${
        isDragging
          ? "border-indigo-500 bg-indigo-50 shadow-lg"
          : isSelected
            ? "border-indigo-500 bg-indigo-50"
            : "hover:border-gray-400 hover:shadow-sm"
      } ${isFlagged ? "border-l-4 border-l-amber-500" : ""}`}
      onClick={() => onSelect(objective)}
    >
      <div className="flex items-start">
        <div
          {...attributes}
          {...listeners}
          className="draggable-handle cursor-grab active:cursor-grabbing p-2 mr-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors touch-none"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-6 w-6" />
        </div>

        {/* Add objective number */}
        <div className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm mr-2 flex-shrink-0">
          {index + 1}
        </div>

        <div className="flex-grow">
          <div className="flex justify-between mb-1">
            <div className="flex items-center">
              <h4 className="font-medium">{objective.title}</h4>
              {isFlagged && (
                <div className="ml-2 text-amber-500">
                  <Flag className="h-4 w-4 fill-amber-500" />
                </div>
              )}
            </div>
            <span className="text-indigo-600">{objective.progress}%</span>
          </div>
          <ProgressBar progress={objective.progress} />

          {/* Always display all indicators */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {/* Flag indicator for smaller screens */}
            {isFlagged && (
              <div className="flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                <Flag className="h-3 w-3 mr-1 fill-amber-500" />
                <span>Marqué</span>
              </div>
            )}

            {/* TTM indicator */}
            <div
              className={`flex items-center px-2 py-1 rounded-full ${formattedDate ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"}`}
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>TTM: {formattedDate || "Non défini"}</span>
            </div>

            {/* Urgent indicator */}
            <div
              className={`flex items-center px-2 py-1 rounded-full ${objective.isUrgent ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Urgent</span>
              {objective.isUrgent ? <Check className="h-3 w-3 ml-1" /> : <X className="h-3 w-3 ml-1" />}
            </div>

            {/* Important indicator */}
            <div
              className={`flex items-center px-2 py-1 rounded-full ${objective.isImportant ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}
            >
              <Star className="h-3 w-3 mr-1" />
              <span>Important</span>
              {objective.isImportant ? <Check className="h-3 w-3 ml-1" /> : <X className="h-3 w-3 ml-1" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default DashboardObjective
