"use client"

import { useState, useEffect, useCallback, memo, useRef } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
  TouchSensor,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { Task, Member } from "@/types"
import { DraggableTask } from "@/components/features/planning/draggable-task"
import { createPortal } from "react-dom"
import { GripVertical } from "lucide-react"
import { lockScroll, unlockScroll } from "@/lib/scroll-utils"
import { ComplexityBadge } from "@/components/complexity-badge"
import { CriticalityBadge } from "@/components/criticality-badge"

interface DraggableTaskListProps {
  tasks: Task[]
  objectiveId: string
  teamMembers: Member[]
  onDeleteTask: (objectiveId: string, taskId: string) => Promise<void>
  onToggleTaskCompletion: (objectiveId: string, taskId: string) => Promise<void>
  onEditTask: (task: Task) => void
  onTasksReordered: (tasks: Task[]) => Promise<void>
}

// Custom drop animation for smoother transitions
const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
}

// Measuring strategy for more accurate drag positioning
const measuringConfig = {
  strategy: MeasuringStrategy.Always,
}

export const DraggableTaskList = memo(function DraggableTaskList({
  tasks,
  objectiveId,
  teamMembers,
  onDeleteTask,
  onToggleTaskCompletion,
  onEditTask,
  onTasksReordered,
}: DraggableTaskListProps) {
  const [items, setItems] = useState<Task[]>(tasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null) // Track active item index for drag overlay
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Refs to track if we're currently updating the database
  const isUpdatingTasks = useRef(false)

  // Debounce timer ref
  const tasksUpdateTimer = useRef<NodeJS.Timeout | null>(null)

  // Mount state for client-side rendering and detect mobile
  useEffect(() => {
    setIsMounted(true)

    // Detect if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      )
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    // Clean up any pending timers on unmount
    return () => {
      if (tasksUpdateTimer.current) {
        clearTimeout(tasksUpdateTimer.current)
      }
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Update local state when tasks prop changes
  useEffect(() => {
    // Only update if the tasks array has actually changed
    if (JSON.stringify(tasks) !== JSON.stringify(items)) {
      // Sort tasks by position
      const sortedTasks = [...tasks].sort((a, b) => (a.position || 0) - (b.position || 0))
      setItems(sortedTasks)
    }
  }, [tasks, items])

  // Configure sensors with optimized settings for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Different activation constraints based on device type
      activationConstraint: isMobile
        ? {
            // For mobile: make dragging more immediate with minimal delay
            delay: 100,
            tolerance: 8,
          }
        : {
            // For desktop: quicker activation
            distance: 5,
            delay: 0,
            tolerance: 5,
          },
    }),
    // Add dedicated TouchSensor with mobile-specific settings
    useSensor(TouchSensor, {
      // Make touch dragging more immediate
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Debounced database update function
  const debouncedUpdateTaskPositions = useCallback(
    (updatedTasks: Task[]) => {
      // Clear any existing timer
      if (tasksUpdateTimer.current) {
        clearTimeout(tasksUpdateTimer.current)
      }

      // Set a new timer to update the database after a delay
      tasksUpdateTimer.current = setTimeout(async () => {
        if (!isUpdatingTasks.current) {
          isUpdatingTasks.current = true
          try {
            await onTasksReordered(updatedTasks)
          } catch (error) {
            console.error("Error updating task positions:", error)
          } finally {
            isUpdatingTasks.current = false
          }
        }
      }, 500) // 500ms debounce
    },
    [onTasksReordered],
  )

  const handleDragStart = useCallback(
    (event: any) => {
      // Lock scrolling when drag starts
      lockScroll()

      const { active } = event
      setActiveId(active.id)

      // Store the index of the active item for the drag overlay
      const index = items.findIndex((item) => item.id === active.id)
      setActiveIndex(index)
    },
    [items],
  )

  const handleDragCancel = useCallback(() => {
    // Unlock scrolling when drag is cancelled
    unlockScroll()
    setActiveId(null)
    setActiveIndex(null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      // Unlock scrolling when drag ends
      unlockScroll()
      setActiveId(null)
      setActiveIndex(null)

      if (over && active.id !== over.id) {
        setItems((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id)
          const newIndex = items.findIndex((item) => item.id === over.id)

          const newItems = arrayMove(items, oldIndex, newIndex).map((task, index) => ({
            ...task,
            position: index, // Update position based on new index
          }))

          // Update local state immediately for a smooth UI experience
          setItems(newItems)

          // Debounced update to the database
          debouncedUpdateTaskPositions(newItems)

          return newItems
        })
      }
    },
    [debouncedUpdateTaskPositions],
  )

  // Find active task for drag overlay
  const activeTask = activeId ? items.find((task) => task.id === activeId) : null
  const assignedMember = activeTask?.assignee ? teamMembers.find((m) => m.id === activeTask.assignee) : null

  return (
    <div className="space-y-2 mt-3">
      {tasks.length === 0 ? (
        <p className="text-gray-500 text-sm italic">Aucune tâche pour cet objectif.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          measuring={measuringConfig}
        >
          <SortableContext items={items.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            {items.map((task, index) => (
              <DraggableTask
                key={task.id}
                task={task}
                objectiveId={objectiveId}
                teamMembers={teamMembers}
                onDeleteTask={onDeleteTask}
                onToggleTaskCompletion={onToggleTaskCompletion}
                onEditTask={onEditTask}
                isMobile={isMobile}
                index={index} // Pass index for numbering
              />
            ))}
          </SortableContext>

          {isMounted &&
            createPortal(
              <DragOverlay dropAnimation={dropAnimation}>
                {activeTask && (
                  <div className="border rounded p-3 bg-white shadow-lg border-indigo-500 opacity-80">
                    <div className="flex items-start">
                      <div className="cursor-grab p-2 mr-2 text-gray-400">
                        <GripVertical className="h-5 w-5" />
                      </div>

                      {/* Add task number in drag overlay */}
                      {activeIndex !== null && (
                        <div className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full font-medium text-sm mr-2 flex-shrink-0">
                          {activeIndex + 1}
                        </div>
                      )}

                      <div className="mt-1.5 h-4 w-4 mr-3 border-2 border-gray-300 rounded" />
                      <div className="flex-grow">
                        <p className="text-base mb-3">{activeTask.title}</p>
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

                        {/* Add complexity and criticality badges */}
                        <div className="flex flex-wrap gap-2">
                          <ComplexityBadge complexity={activeTask.complexity} className="text-xs" />
                          <CriticalityBadge criticality={activeTask.criticality} className="text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      )}
    </div>
  )
})
