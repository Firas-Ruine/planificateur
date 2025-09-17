"use client"

import { useState, useEffect, useCallback, memo, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
  TouchSensor,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { Objective, Task, Member, Stats, ObjectiveCategory } from "@/types"
import { DashboardObjective } from "@/components/features/dashboard/dashboard-objective"
import { DashboardTask } from "@/components/features/dashboard/dashboard-task"
import { createPortal } from "react-dom"
import { GripVertical, Loader2, CheckCircle2, ClipboardList, Calendar, Heart, Flag } from "lucide-react"
import { lockScroll, unlockScroll } from "@/lib/scroll-utils"
import { UserFilter } from "@/components/user-filter"
import { ProgressBar } from "@/components/progress-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { ComplexityBadge } from "@/components/complexity-badge"
import { CriticalityBadge } from "@/components/criticality-badge"
import { CompactBadges } from "@/components/compact-badges"
interface DashboardViewProps {
  objectives: Objective[]
  teamMembers: Member[]
  stats: Stats | null
  loading?: boolean
  selectedWeek?: string
  onObjectivesReordered: (objectives: Objective[]) => Promise<void>
  onTasksReordered: (objectiveId: string, tasks: Task[]) => Promise<void>
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

// Add this helper function inside the component or at the top level
const determineCategory = (objective: Objective): ObjectiveCategory => {
  if (objective.category) return objective.category as ObjectiveCategory

  if (objective.isUrgent && objective.isImportant) return "urgent-important"
  if (objective.isImportant) return "important-not-urgent"
  if (objective.isUrgent) return "urgent-not-important"
  return "not-urgent-not-important"
}

export function DashboardView({
  objectives,
  teamMembers,
  stats,
  loading = false,
  selectedWeek: propSelectedWeek = "",
  onObjectivesReordered,
  onTasksReordered,
}: DashboardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<"objective" | "task" | null>(null)
  const [items, setItems] = useState<Objective[]>(objectives)
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [scrollPosition, setScrollPosition] = useState(0)
  const [selectedWeek, setSelectedWeek] = useState("")
  const [activeIndex, setActiveIndex] = useState<number | null>(null) // Track active item index for drag overlay
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)

  // Mount state for client-side rendering and detect mobile
  useEffect(() => {
    setIsMounted(true)

    // Set the selected week from props if provided
    if (propSelectedWeek) {
      setSelectedWeek(propSelectedWeek)
    }

    // Detect if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      )
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [propSelectedWeek])

  // Update local state when objectives prop changes
  useEffect(() => {
    // Only update if the objectives array has actually changed
    if (JSON.stringify(objectives) !== JSON.stringify(items)) {
      // Sort objectives by position before setting state
      const sortedObjectives = [...objectives].sort((a, b) => (a.position || 0) - (b.position || 0))
      setItems(sortedObjectives)

      // Check if we've changed products
      if (sortedObjectives.length > 0 && sortedObjectives[0].productId !== currentProductId) {
        // If product has changed, reset the selected objective
        setSelectedObjective(null)
        setCurrentProductId(sortedObjectives[0].productId)
      } else if (selectedObjective) {
        // If we're still on the same product, update the selected objective if it exists
        const updatedSelectedObjective = objectives.find((obj) => obj.id === selectedObjective.id)
        if (updatedSelectedObjective) {
          // Sort tasks by position
          const sortedTasks = [...updatedSelectedObjective.tasks].sort((a, b) => (a.position || 0) - (b.position || 0))
          setSelectedObjective({
            ...updatedSelectedObjective,
            tasks: sortedTasks,
          })
        } else {
          // If the selected objective no longer exists in the new objectives, reset it
          setSelectedObjective(null)
        }
      }
    }
  }, [objectives, items, selectedObjective, currentProductId])

  // Configure sensors with optimized settings for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Different activation constraints based on device type
      activationConstraint: {
        // Use the same settings for both mobile and desktop for consistency
        delay: 100,
        tolerance: 8,
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

  const handleUserSelectionChange = useCallback((newSelectedUsers: string[]) => {
    setSelectedUsers(newSelectedUsers)
  }, [])

  // Filter all content based on selected users
  const filteredObjectives = useMemo(() => {
    if (selectedUsers.length === 0) {
      return items
    }

    return items
      .map((objective) => ({
        ...objective,
        tasks: objective.tasks.filter((task) => task.assignee && selectedUsers.includes(task.assignee)),
      }))
      .filter((objective) => objective.tasks.length > 0)
  }, [items, selectedUsers])

  // Update the handleDragStart function to add a class to the body
  const handleDragStart = useCallback(
    (event: any) => {
      const { active } = event

      // Save current scroll position
      setScrollPosition(window.scrollY)

      // Set active item based on type
      const itemType = active.data.current?.type || (active.data.current?.objective ? "objective" : "task")

      setActiveId(active.id)
      setActiveType(itemType)

      // Store the index of the active item for the drag overlay
      if (itemType === "objective") {
        const index = filteredObjectives.findIndex((obj) => obj.id === active.id)
        setActiveIndex(index)
      } else if (itemType === "task" && selectedObjective) {
        const index = selectedObjective.tasks.findIndex((task) => task.id === active.id)
        setActiveIndex(index)
      }

      // Add dragging class to body for styling
      document.body.classList.add("dragging")

      // Lock scrolling
      lockScroll()
    },
    [filteredObjectives, selectedObjective],
  )

  // Update the handleDragEnd and handleDragCancel functions to remove the class
  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event

      // Remove dragging class
      document.body.classList.remove("dragging")

      // Unlock scrolling
      unlockScroll()

      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, scrollPosition)
      }, 0)

      // Exit if no valid drop target
      if (!over) {
        setActiveId(null)
        setActiveType(null)
        setActiveIndex(null)
        return
      }

      if (active.id !== over.id) {
        // Determine the type of drag operation
        const itemType = active.data.current?.type || (active.data.current?.objective ? "objective" : "task")

        if (itemType === "objective") {
          // Handle objective reordering with persistence
          setItems((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id)
            const newIndex = items.findIndex((item) => item.id === over.id)

            const newItems = arrayMove(items, oldIndex, newIndex).map((objective, index) => ({
              ...objective,
              position: index, // Update position based on new index
            }))

            // Persist the changes to the database
            onObjectivesReordered(newItems).catch((err) => {
              console.error("Failed to persist objective positions:", err)
            })

            return newItems
          })
        } else if (itemType === "task" && selectedObjective) {
          // Handle task reordering with persistence
          setItems((items) => {
            const objectiveIndex = items.findIndex((obj) => obj.id === selectedObjective.id)

            if (objectiveIndex === -1) return items

            const tasks = [...items[objectiveIndex].tasks]
            const oldIndex = tasks.findIndex((task) => task.id === active.id)
            const newIndex = tasks.findIndex((task) => task.id === over.id)

            const newTasks = arrayMove(tasks, oldIndex, newIndex).map((task, index) => ({
              ...task,
              position: index, // Update position based on new index
            }))

            // Persist the changes to the database
            onTasksReordered(selectedObjective.id, newTasks).catch((err) => {
              console.error("Failed to persist task positions:", err)
            })

            // Update local state
            const newItems = [...items]
            newItems[objectiveIndex] = {
              ...newItems[objectiveIndex],
              tasks: newTasks,
            }

            // Also update the selected objective
            setSelectedObjective({
              ...selectedObjective,
              tasks: newTasks,
            })

            return newItems
          })
        }
      }

      setActiveId(null)
      setActiveType(null)
      setActiveIndex(null)
    },
    [activeType, selectedObjective, onObjectivesReordered, onTasksReordered, scrollPosition],
  )

  const handleDragCancel = useCallback(() => {
    // Remove dragging class
    document.body.classList.remove("dragging")

    // Unlock scrolling
    unlockScroll()

    // Restore scroll position
    setTimeout(() => {
      window.scrollTo(0, scrollPosition)
    }, 0)

    setActiveId(null)
    setActiveType(null)
    setActiveIndex(null)
  }, [scrollPosition])

  // Filter tasks based on selected users
  const getFilteredTasks = useCallback(() => {
    if (!selectedObjective) return []

    if (selectedUsers.length === 0) {
      // Sort tasks by position
      return [...selectedObjective.tasks].sort((a, b) => (a.position || 0) - (b.position || 0))
    }

    // Filter and sort tasks
    return selectedObjective.tasks
      .filter((task) => task.assignee && selectedUsers.includes(task.assignee))
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  }, [selectedObjective, selectedUsers])

  // Find active item for drag overlay
  const activeObjective = activeType === "objective" && activeId ? items.find((obj) => obj.id === activeId) : null

  const activeTask =
    activeType === "task" && activeId && selectedObjective
      ? selectedObjective.tasks.find((task) => task.id === activeId)
      : null

  const activeTaskAssignee = activeTask?.assignee ? teamMembers.find((m) => m.id === activeTask.assignee) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-lg">Chargement du dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Filter at the top */}
      <div className="bg-white rounded-lg shadow p-4">
        <UserFilter users={teamMembers} selectedUsers={selectedUsers} onSelectionChange={handleUserSelectionChange} />
      </div>

      {/* Current Week Indicator */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 flex items-center">
        <div className="bg-indigo-100 rounded-full p-2 mr-3">
          <Calendar className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-grow">
          <p className="text-sm text-indigo-600">
            Vous visualisez les données pour la période:{" "}
            <span className="font-medium">{selectedWeek || "17/03/2025 - 23/03/2025"}</span>
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Objectifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredObjectives.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tâches totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredObjectives.reduce((sum, obj) => sum + obj.tasks.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tâches complétées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredObjectives.reduce((sum, obj) => sum + obj.tasks.filter((t) => t.completed).length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progression globale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {Math.round(
                (filteredObjectives.reduce((sum, obj) => sum + obj.tasks.filter((t) => t.completed).length, 0) /
                  Math.max(
                    filteredObjectives.reduce((sum, obj) => sum + obj.tasks.length, 0),
                    1,
                  )) *
                  100,
              )}
              %
            </div>
            <ProgressBar
              progress={Math.round(
                (filteredObjectives.reduce((sum, obj) => sum + obj.tasks.filter((t) => t.completed).length, 0) /
                  Math.max(
                    filteredObjectives.reduce((sum, obj) => sum + obj.tasks.length, 0),
                    1,
                  )) *
                  100,
              )}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Objectives list */}
        <div className="bg-white rounded-lg shadow p-4 h-full min-h-[600px]">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Objectifs</h2>

          {filteredObjectives.length === 0 ? (
            <EmptyState
              type={selectedUsers.length > 0 ? "filtered" : "objectives"}
              filtered={selectedUsers.length > 0}
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              measuring={measuringConfig}
              autoScroll={false}
            >
              <SortableContext items={filteredObjectives.map((obj) => obj.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredObjectives.map((objective, index) => (
                    <DashboardObjective
                      key={objective.id}
                      objective={objective}
                      isSelected={selectedObjective?.id === objective.id}
                      onSelect={(objective) => {
                        // Find the most up-to-date version of the objective from items
                        const currentObjective = items.find((obj) => obj.id === objective.id) || objective

                        // Explicitly set the selected objective with sorted tasks
                        const sortedTasks = [...currentObjective.tasks].sort(
                          (a, b) => (a.position || 0) - (b.position || 0),
                        )
                        setSelectedObjective({
                          ...currentObjective,
                          tasks: sortedTasks,
                        })
                      }}
                      isMobile={isMobile}
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>

              {isMounted &&
                createPortal(
                  <DragOverlay dropAnimation={dropAnimation}>
                    {activeObjective && (
                      <div
                        className={`border rounded-lg p-4 bg-white shadow-lg border-indigo-500 opacity-80 ${activeObjective.flag?.isFlagged ? "border-l-4 border-l-amber-500" : ""}`}
                      >
                        <div className="flex items-start">
                          <div className="cursor-grab p-2 mr-2 text-gray-400">
                            <GripVertical className="h-6 w-6" />
                          </div>

                          {activeIndex !== null && (
                            <div className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm mr-2 flex-shrink-0">
                              {activeIndex + 1}
                            </div>
                          )}

                          <div className="flex-grow">
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center">
                                <h4 className="font-medium">{activeObjective.title}</h4>
                                {activeObjective.flag?.isFlagged && (
                                  <div className="ml-2 text-amber-500">
                                    <Flag className="h-4 w-4 fill-amber-500" />
                                  </div>
                                )}
                              </div>
                              <span className="text-indigo-600">{activeObjective.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${activeObjective.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTask && activeTaskAssignee && (
                      <div className="flex items-center gap-3 p-2 bg-white rounded-lg border shadow-lg opacity-80">
                        <div className="cursor-grab p-2 text-gray-400">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        {activeIndex !== null && (
                          <div className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full font-medium text-sm flex-shrink-0">
                            {activeIndex + 1}
                          </div>
                        )}

                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={activeTaskAssignee.avatar || "/placeholder.svg"}
                            alt={activeTaskAssignee.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            {activeTask.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                            )}
                            <span className={activeTask.completed ? "text-gray-500" : "text-gray-700"}>
                              {activeTask.title}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{activeTaskAssignee.name}</p>

                          <div className="flex flex-wrap gap-2 mt-2">
                            <ComplexityBadge complexity={activeTask.complexity} className="text-xs py-0.5 px-1.5" />
                            <CriticalityBadge criticality={activeTask.criticality} className="text-xs py-0.5 px-1.5" />
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

        {/* Tasks section */}
        <div className="bg-white rounded-lg shadow p-4 h-full min-h-[600px]">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Liste des tâches</h2>
          {selectedObjective ? (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-700">{selectedObjective.title}</h3>
                </div>

                {/* Flag description section - directly displayed when objective is flagged */}
                {selectedObjective.flag?.isFlagged && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <Flag className="h-5 w-5 text-amber-500 fill-amber-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-amber-800">Objectif Marqué</h4>
                        <p className="mt-1 text-sm text-amber-700">
                          {selectedObjective.flag.description || "Cet objectif a été marqué comme important."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {getFilteredTasks().length === 0 ? (
                <EmptyState type="tasks" filtered={selectedUsers.length > 0} />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                  measuring={measuringConfig}
                  autoScroll={false}
                >
                  <SortableContext
                    items={getFilteredTasks().map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                      {getFilteredTasks().map((task, index) => {
                        const assignee = task.assignee ? teamMembers.find((m) => m.id === task.assignee) : null
                        return (
                          <DashboardTask
                            key={task.id}
                            task={task}
                            assignee={assignee}
                            isMobile={isMobile}
                            index={index}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] px-4">
              <div className="bg-gray-100 rounded-full p-4 mb-6 w-20 h-20 flex items-center justify-center">
                <ClipboardList className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Sélectionnez un objectif</h3>
              <p className="text-gray-500 text-center max-w-sm">
                Sélectionnez un objectif dans la liste pour voir ses tâches associées
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Task Assignment Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Progression</h2>
        <div className="space-y-4">
          {teamMembers
            .filter((member) => {
              const hasTasks = filteredObjectives
                .flatMap((obj) => obj.tasks)
                .some((task) => task.assignee === member.id)

              return hasTasks && (selectedUsers.length === 0 || selectedUsers.includes(member.id))
            })
            .map((member) => {
              const memberTasks = filteredObjectives
                .flatMap((obj) => obj.tasks)
                .filter((task) => task.assignee === member.id)
                .sort((a, b) => (a.position || 0) - (b.position || 0))
              const completedTasks = memberTasks.filter((task) => task.completed).length

              return (
                <div key={member.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={member.avatar || "/placeholder.svg"}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium">{member.name}</h3>
                      <span className="text-sm text-gray-500">
                        {completedTasks}/{memberTasks.length} tâches
                      </span>
                    </div>
                    <ProgressBar progress={memberTasks.length > 0 ? (completedTasks / memberTasks.length) * 100 : 0} />
                    {memberTasks.map((task, index) => (
                      <div key={task.id} className="mt-2 pl-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.completed ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className="text-xs text-gray-500 font-medium">{index + 1}.</span>
                          <span>{task.title}</span>
                          <CompactBadges
                            complexity={task.complexity}
                            criticality={task.criticality}
                            className="ml-auto"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

          {teamMembers.filter((member) => {
            const hasTasks = filteredObjectives.flatMap((obj) => obj.tasks).some((task) => task.assignee === member.id)
            return hasTasks && (selectedUsers.length === 0 || selectedUsers.includes(member.id))
          }).length === 0 && (
            <div className="text-center py-6 text-gray-500">
              Aucun utilisateur n'a de tâches assignées{" "}
              {selectedUsers.length > 0 ? "avec les filtres sélectionnés" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm text-gray-500">
        Made with <Heart className="inline h-4 w-4 text-red-500 mx-1" fill="currentColor" /> by MDW
      </div>
    </div>
  )
}

export default memo(DashboardView)
