"use client"

import { useState, useCallback, memo } from "react"
import type { Objective, Task, Member, ObjectiveCategory } from "@/types"
import { ProgressBar } from "@/components/progress-bar"
import { MemberBadge } from "@/components/member-badge"
import { ComplexityBadge } from "@/components/complexity-badge"
import { CriticalityBadge } from "@/components/criticality-badge"
import { Loader2, Pencil, Clock, Target, CalendarIcon, Flag, FlagOff, Copy } from "lucide-react"
import { SearchableMemberSelect } from "@/components/searchable-member-select"
import { EditObjectiveDialog } from "@/components/features/planning/edit-objective-dialog"
import { EditTaskDialog } from "@/components/features/planning/edit-task-dialog"
import { FlagObjectiveDialog } from "@/components/features/planning/flag-objective-dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { flagObjective, unflagObjective } from "@/services/firebase-service"
import { CloneObjectiveDialog } from "@/components/features/planning/clone-objective-dialog"

// Update the ObjectivesViewProps interface
interface ObjectivesViewProps {
  objectives: Objective[]
  activeObjective: Objective | null
  teamMembers: Member[]
  loading?: boolean
  dataMode?: "firebase" | "mock" | "loading"
  onAddObjective: (objective: { title: string; category: ObjectiveCategory; targetCompletionDate?: Date }) => Promise<
    Objective | undefined
  >
  onDeleteObjective: (objectiveId: string) => Promise<void>
  onSelectObjective: (objective: Objective | null) => void
  onAddTask: (objectiveId: string, task: Omit<Task, "id" | "objectiveId" | "completed">) => Promise<Task | null>
  onDeleteTask: (objectiveId: string, taskId: string) => Promise<void>
  onToggleTaskCompletion: (objectiveId: string, taskId: string) => Promise<void>
  onUpdateObjective?: (objectiveId: string, updates: Partial<Objective>) => Promise<void>
  onUpdateTask?: (objectiveId: string, taskId: string, updates: Partial<Task>) => Promise<void>
}

// Helper component for objective category badges
const ObjectiveCategoryBadge = ({ category }: { category: ObjectiveCategory }) => {
  switch (category) {
    case "urgent-important":
      return <Badge className="bg-red-500 text-white">Urgent & Important</Badge>
    case "important-not-urgent":
      return <Badge className="bg-blue-500 text-white">Important & Non Urgent</Badge>
    case "urgent-not-important":
      return <Badge className="bg-orange-500 text-white">Urgent & Non Important</Badge>
    case "not-urgent-not-important":
      return <Badge className="bg-gray-500 text-white">Standard</Badge>
    default:
      return <Badge className="bg-gray-500 text-white">Non catégorisé</Badge>
  }
}

// Helper function to determine category
const determineCategory = (objective: Objective): ObjectiveCategory => {
  if (objective.category) return objective.category

  if (objective.isUrgent && objective.isImportant) return "urgent-important"
  if (objective.isImportant) return "important-not-urgent"
  if (objective.isUrgent) return "urgent-not-important"
  return "not-urgent-not-important"
}

// Helper function to convert Firestore timestamp to Date
const convertToDate = (date: any): Date | null => {
  if (!date) return null

  // If it's already a Date object
  if (date instanceof Date) return date

  // If it's a Firestore timestamp (has seconds and nanoseconds)
  if (date && typeof date === "object" && "seconds" in date && "nanoseconds" in date) {
    return new Date(date.seconds * 1000)
  }

  // If it's a timestamp number
  if (typeof date === "number") {
    return new Date(date)
  }

  // If it's an ISO string
  if (typeof date === "string") {
    const parsedDate = new Date(date)
    return isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  return null
}

// Helper function to format target date
const formatTargetDate = (date: any): string | null => {
  if (!date) return null

  try {
    // Convert to proper Date object if needed
    const dateObj = convertToDate(date)

    if (!dateObj) {
      console.error("Could not convert to date:", date)
      return null
    }

    return format(dateObj, "PPP", { locale: fr })
  } catch (error) {
    console.error("Error formatting date:", error, date)
    return null
  }
}

// Update the ObjectivesList component
const ObjectivesList = memo(
  ({
    objectives,
    activeObjective,
    onSelectObjective,
    onDeleteObjectiveClick,
    onEditObjective,
    onFlagObjective,
    onCloneObjective,
    loading,
  }: {
    objectives: Objective[]
    activeObjective: Objective | null
    onSelectObjective: (objective: Objective) => void
    onDeleteObjectiveClick: (objectiveId: string) => void
    onEditObjective: (objective: Objective) => void
    onFlagObjective: (objective: Objective) => void
    onCloneObjective: (objective: Objective) => void
    loading?: boolean
  }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="ml-2">Chargement des objectifs...</span>
        </div>
      )
    }

    // Sort objectives by position
    const sortedObjectives = [...objectives].sort((a, b) => (a.position || 0) - (b.position || 0))

    return (
      <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto">
        {sortedObjectives.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            Aucun objectif défini. Ajoutez-en un ou générez des suggestions.
          </p>
        )}

        {sortedObjectives.map((obj, index) => {
          const formattedDate = obj.targetCompletionDate ? formatTargetDate(obj.targetCompletionDate) : null
          const isFlagged = obj.flag?.isFlagged || false

          return (
            <div
              key={obj.id}
              onClick={() => onSelectObjective(obj)}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                isFlagged ? "border-amber-400 border-l-4" : ""
              } ${
                activeObjective && activeObjective.id === obj.id ? "border-indigo-500 bg-indigo-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-between">
                <div className="flex items-center">
                  {/* Add objective number */}
                  <div className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm mr-2 flex-shrink-0">
                    {index + 1}
                  </div>
                  <h3 className="font-medium text-gray-800">{obj.title}</h3>

                  {/* Flag indicator with tooltip */}
                  {isFlagged && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipContent>
                          <p className="max-w-xs">{obj.flag?.description || "Objectif marqué"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onFlagObjective(obj)
                    }}
                    className="text-amber-500 hover:text-amber-700 transition-colors p-1"
                    aria-label={isFlagged ? "Modifier le marquage" : "Marquer l'objectif"}
                  >
                    {isFlagged ? <Flag className="h-4 w-4" /> : <FlagOff className="h-4 w-4" />}
                  </button>
                 <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloneObjective(obj)
                    }}
                    className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                    aria-label="Cloner l'objectif"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditObjective(obj)
                    }}
                    className="text-indigo-500 hover:text-indigo-700 transition-colors p-1"
                    aria-label="Modifier l'objectif"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteObjectiveClick(obj.id)
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    aria-label="Supprimer l'objectif"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{obj.tasks.length} tâches</span>
                  <span>{obj.progress}% complété</span>
                </div>
                <ProgressBar progress={obj.progress} />
              </div>

              <div className="mt-2 flex flex-wrap gap-1 justify-between">
                <ObjectiveCategoryBadge category={determineCategory(obj)} />
                {formattedDate && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    TTM: {formattedDate}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  },
)

// TasksList component remains mostly the same
const TasksList = memo(
  ({
    tasks,
    objectiveId,
    teamMembers,
    onToggleTaskCompletion,
    onDeleteTask,
    onEditTask,
    loading,
    onDeleteTaskClick,
  }: {
    tasks: Task[]
    objectiveId: string
    teamMembers: Member[]
    onToggleTaskCompletion: (objectiveId: string, taskId: string) => Promise<void>
    onDeleteTask: (objectiveId: string, taskId: string) => Promise<void>
    onEditTask: (task: Task) => void
    loading?: boolean
    onDeleteTaskClick: (objectiveId: string, taskId: string) => void
  }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="ml-2">Chargement des tâches...</span>
        </div>
      )
    }

    // Sort tasks by position
    const sortedTasks = [...tasks].sort((a, b) => (a.position || 0) - (b.position || 0))

    return (
      <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto">
        {sortedTasks.length === 0 && (
          <p className="text-gray-500 text-center py-4">Aucune tâche pour cet objectif. Ajoutez-en une.</p>
        )}

        {sortedTasks.map((task, index) => {
          const assignedMember = task.assignee ? teamMembers.find((m) => m.id === task.assignee) : null

          return (
            <div key={task.id} className="border rounded p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTaskCompletion(objectiveId, task.id)}
                  className="mt-1.5 h-4 w-4"
                />

                {/* Add task number */}
                <div className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full font-medium text-sm flex-shrink-0">
                  {index + 1}
                </div>

                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <p className={`text-base mb-3 ${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditTask(task)}
                        className="text-indigo-500 hover:text-indigo-700 transition-colors p-1"
                        aria-label="Modifier la tâche"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTaskClick(objectiveId, task.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        aria-label="Supprimer la tâche"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {assignedMember && (
                    <div className="mb-3">
                      <MemberBadge member={assignedMember} size="md" />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <ComplexityBadge complexity={task.complexity} />
                    <CriticalityBadge criticality={task.criticality} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  },
)

// Main ObjectivesView component
export function ObjectivesView({
  objectives,
  activeObjective,
  teamMembers,
  loading = false,
  dataMode = "firebase",
  onAddObjective,
  onDeleteObjective,
  onSelectObjective,
  onAddTask,
  onDeleteTask,
  onToggleTaskCompletion,
  onUpdateObjective,
  onUpdateTask,
}: ObjectivesViewProps) {
  const [newObjectiveTitle, setNewObjectiveTitle] = useState("")
  const [newTask, setNewTask] = useState<Omit<Task, "id" | "objectiveId" | "completed">>({
    title: "",
    assignee: null,
    complexity: "medium",
    criticality: "medium",
    position: 0,
  })

  // State for urgency and importance
  const [isUrgent, setIsUrgent] = useState(true)
  const [isImportant, setIsImportant] = useState(true)

  // State for target completion date
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)

  // Derived state for category based on urgency and importance - FIXED LOGIC
  const objectiveCategory: ObjectiveCategory =
    isUrgent && isImportant
      ? "urgent-important"
      : isImportant && !isUrgent
        ? "important-not-urgent"
        : isUrgent && !isImportant
          ? "urgent-not-important"
          : "not-urgent-not-important"

  const [addingObjective, setAddingObjective] = useState(false)
  const [addingTask, setAddingTask] = useState(false)

  // Edit dialogs state
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)
  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  // Flag dialog state
  const [flaggingObjective, setFlaggingObjective] = useState<Objective | null>(null)
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false)

  const [isDeleteObjectiveConfirmOpen, setIsDeleteObjectiveConfirmOpen] = useState(false)
  const [objectiveToDelete, setObjectiveToDelete] = useState<string | null>(null)

  const [isDeleteTaskConfirmOpen, setIsDeleteTaskConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<{ objectiveId: string; taskId: string } | null>(null)

  const [cloningObjective, setCloningObjective] = useState<Objective | null>(null)
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)

  const handleDeleteObjectiveClick = (objectiveId: string) => {
    setObjectiveToDelete(objectiveId)
    setIsDeleteObjectiveConfirmOpen(true)
  }

  const handleConfirmDeleteObjective = async () => {
    if (objectiveToDelete) {
      await onDeleteObjective(objectiveToDelete)
      setObjectiveToDelete(null)
    }
  }

  const handleDeleteTaskClick = (objectiveId: string, taskId: string) => {
    setTaskToDelete({ objectiveId, taskId })
    setIsDeleteTaskConfirmOpen(true)
  }

  const handleConfirmDeleteTask = async () => {
    if (taskToDelete) {
      await onDeleteTask(taskToDelete.objectiveId, taskToDelete.taskId)
      setTaskToDelete(null)
    }
  }

  // Handle opening the objective edit dialog
  const handleEditObjective = (objective: Objective) => {
    // Convert the targetCompletionDate to a proper Date object if needed
    if (
      objective.targetCompletionDate &&
      typeof objective.targetCompletionDate === "object" &&
      "seconds" in objective.targetCompletionDate
    ) {
      objective = {
        ...objective,
        targetCompletionDate: convertToDate(objective.targetCompletionDate),
      }
    }

    setEditingObjective(objective)
    setIsObjectiveDialogOpen(true)
  }

  // Handle opening the flag dialog
  const handleFlagObjective = (objective: Objective) => {
    setFlaggingObjective(objective)
    setIsFlagDialogOpen(true)
  }

  // Handle opening the clone dialog
  const handleCloneObjective = (objective: Objective) => {
    setCloningObjective(objective)
    setIsCloneDialogOpen(true)
  }

  // Handle saving flag
  const handleSaveFlag = async (objectiveId: string, description: string) => {
    try {
      await flagObjective(objectiveId, description)

      // Update the objective in the local state
      if (onUpdateObjective) {
        await onUpdateObjective(objectiveId, {
          flag: {
            isFlagged: true,
            description,
          },
        })
      }
    } catch (error) {
      console.error("Error flagging objective:", error)
    }
  }

  // Handle removing flag
  const handleRemoveFlag = async (objectiveId: string) => {
    try {
      await unflagObjective(objectiveId)

      // Update the objective in the local state
      if (onUpdateObjective) {
        await onUpdateObjective(objectiveId, {
          flag: {
            isFlagged: false,
            description: "",
          },
        })
      }
    } catch (error) {
      console.error("Error unflagging objective:", error)
    }
  }

  // Handle opening the task edit dialog
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskDialogOpen(true)
  }

  // Handle closing the objective edit dialog
  const handleCloseObjectiveDialog = () => {
    setIsObjectiveDialogOpen(false)
    // Don't clear the objective immediately to prevent UI flicker
    setTimeout(() => setEditingObjective(null), 300)
  }

  // Handle closing the flag dialog
  const handleCloseFlagDialog = () => {
    setIsFlagDialogOpen(false)
    // Don't clear the objective immediately to prevent UI flicker
    setTimeout(() => setFlaggingObjective(null), 300)
  }

  // Handle closing the task edit dialog
  const handleCloseTaskDialog = () => {
    setIsTaskDialogOpen(false)
    // Don't clear the task immediately to prevent UI flicker
    setTimeout(() => setEditingTask(null), 300)
  }

  // Handle saving edited objective
  const handleSaveObjective = async (
    objectiveId: string,
    title: string,
    isUrgent: boolean,
    isImportant: boolean,
    targetDate?: Date,
  ) => {
    if (onUpdateObjective) {
      // Determine the category based on urgency and importance
      const category: ObjectiveCategory =
        isUrgent && isImportant
          ? "urgent-important"
          : isImportant && !isUrgent
            ? "important-not-urgent"
            : isUrgent && !isImportant
              ? "urgent-not-important"
              : "not-urgent-not-important"

      await onUpdateObjective(objectiveId, {
        title,
        isUrgent,
        isImportant,
        category,
        targetCompletionDate: targetDate,
      })
    }
  }

  // Handle saving edited task
  const handleSaveTask = async (objectiveId: string, taskId: string, updatedTask: Partial<Task>) => {
    if (onUpdateTask) {
      await onUpdateTask(objectiveId, taskId, updatedTask)
    }
  }

  // Handle adding a new objective
  const handleAddObjective = useCallback(async () => {
    if (typeof newObjectiveTitle !== "string" || !newObjectiveTitle.trim()) return

    try {
      setAddingObjective(true)

      // Get the highest position value for objectives
      const maxPosition = objectives.reduce((max, obj) => Math.max(max, obj.position || 0), -1)

      // Create a new objective with the next position
      const newObjective = await onAddObjective({
        title: newObjectiveTitle,
        category: objectiveCategory,
        targetCompletionDate: targetDate,
      })

      // If the objective was created successfully, update its position
      if (newObjective && onUpdateObjective) {
        await onUpdateObjective(newObjective.id, {
          position: maxPosition + 1,
          isUrgent,
          isImportant,
          category: objectiveCategory,
          targetCompletionDate: targetDate,
        })
      }

      setNewObjectiveTitle("")
      // Reset urgency and importance to default values
      setIsUrgent(true)
      setIsImportant(true)
      setTargetDate(undefined)
    } catch (error) {
      console.error("Erreur lors de l'ajout d'un objectif:", error)
    } finally {
      setAddingObjective(false)
    }
  }, [
    newObjectiveTitle,
    objectiveCategory,
    onAddObjective,
    objectives,
    onUpdateObjective,
    isUrgent,
    isImportant,
    targetDate,
  ])

  // Handle adding a new task
  const handleAddTask = useCallback(async () => {
    if (!activeObjective || !newTask.title.trim()) return

    try {
      setAddingTask(true)

      // Get the highest position value for tasks in this objective
      const maxPosition = activeObjective.tasks.reduce((max, task) => Math.max(max, task.position || 0), -1)

      // Create a new task with the next position
      await onAddTask(activeObjective.id, {
        ...newTask,
        position: maxPosition + 1, // Set position to be after the last task
      })

      setNewTask({
        title: "",
        assignee: null,
        complexity: "medium",
        criticality: "medium",
        position: 0,
      })
    } catch (error) {
      console.error("Erreur lors de l'ajout d'une tâche:", error)
    } finally {
      setAddingTask(false)
    }
  }, [activeObjective, newTask, onAddTask])

  // Format the target completion date for the active objective
  const activeObjectiveFormattedDate = activeObjective?.targetCompletionDate
    ? formatTargetDate(activeObjective.targetCompletionDate)
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
      {/* Objectives list */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Objectifs de la semaine</h2>
        </div>

        {/* Add objective form - improved UI */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-700 mb-3">Nouvel objectif</h3>

          <div className="mb-3">
            <input
              type="text"
              value={newObjectiveTitle}
              onChange={(e) => setNewObjectiveTitle(e.target.value)}
              placeholder="Titre de l'objectif"
              className="w-full p-2 border rounded"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddObjective()
              }}
              disabled={addingObjective}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <Label htmlFor="urgent-toggle" className="text-sm font-medium">
                  Urgent
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="urgent-toggle"
                    checked={isUrgent}
                    onCheckedChange={setIsUrgent}
                    disabled={addingObjective}
                  />
                  <span className="text-xs text-gray-500">{isUrgent ? "Oui" : "Non"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <Label htmlFor="important-toggle" className="text-sm font-medium">
                  Important
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="important-toggle"
                    checked={isImportant}
                    onCheckedChange={setIsImportant}
                    disabled={addingObjective}
                  />
                  <span className="text-xs text-gray-500">{isImportant ? "Oui" : "Non"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add target completion date (TTM) */}
          <div className="mb-4">
            <Label htmlFor="target-date">Date d'achèvement cible (TTM)</Label>
            <div className="mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="target-date"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !targetDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} initialFocus locale={fr} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Display the selected category */}
          <div className="mb-4 flex justify-center">
            <ObjectiveCategoryBadge category={objectiveCategory} />
          </div>

          <button
            onClick={handleAddObjective}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center"
            type="button"
            disabled={addingObjective || !newObjectiveTitle.trim()}
          >
            {addingObjective ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Ajout en cours...</span>
              </>
            ) : (
              <span>Ajouter l'objectif</span>
            )}
          </button>
        </div>

        {/* Liste des objectifs - Optimisée avec memo */}
        <ObjectivesList
          objectives={objectives}
          activeObjective={activeObjective}
          onSelectObjective={onSelectObjective}
          onDeleteObjectiveClick={handleDeleteObjectiveClick}
          onEditObjective={handleEditObjective}
          onFlagObjective={handleFlagObjective}
          onCloneObjective={handleCloneObjective}
          loading={loading}
        />
      </div>

      {/* Détails objectif et tâches */}
      <div className="lg:col-span-3 bg-white rounded-lg shadow p-4">
        {activeObjective ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-800">{activeObjective.title}</h2>
                {activeObjective.flag?.isFlagged && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-2">
                          <Flag className="h-5 w-5 text-amber-500" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{activeObjective.flag?.description || "Objectif marqué"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <ObjectiveCategoryBadge category={determineCategory(activeObjective)} />
                {activeObjectiveFormattedDate && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    TTM: {activeObjectiveFormattedDate}
                  </span>
                )}
              </div>
            </div>

            {/* Formulaire ajout tâche */}
            <div className="bg-gray-50 p-3 rounded mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Ajouter une tâche</h3>
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Description de la tâche"
                  className="w-full p-2 border rounded"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTask()
                  }}
                  disabled={addingTask}
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Complexité</label>
                    <select
                      value={newTask.complexity}
                      onChange={(e) => setNewTask({ ...newTask, complexity: e.target.value })}
                      className="w-full p-2 border rounded"
                      disabled={addingTask}
                    >
                      <option value="low">Facile</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Élevée</option>
                      <option value="critical">Critique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Criticité</label>
                    <select
                      value={newTask.criticality}
                      onChange={(e) => setNewTask({ ...newTask, criticality: e.target.value })}
                      className="w-full p-2 border rounded"
                      disabled={addingTask}
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="critical">Critique</option>
                    </select>
                  </div>
                </div>

                <SearchableMemberSelect
                  members={teamMembers}
                  value={newTask.assignee}
                  onChange={(value) => setNewTask({ ...newTask, assignee: value })}
                  placeholder="Assigner à un membre"
                  disabled={addingTask}
                />
                <button
                  onClick={handleAddTask}
                  className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  type="button"
                  disabled={addingTask || !newTask.title.trim()}
                >
                  {addingTask ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Ajout en cours...</span>
                    </>
                  ) : (
                    <span>Ajouter la tâche</span>
                  )}
                </button>
              </div>
            </div>

            {/* Liste des tâches - Optimisée avec memo */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Tâches ({activeObjective.tasks.length})</h3>
              <TasksList
                tasks={activeObjective.tasks}
                objectiveId={activeObjective.id}
                teamMembers={teamMembers}
                onToggleTaskCompletion={onToggleTaskCompletion}
                onDeleteTask={onDeleteTask}
                onEditTask={handleEditTask}
                loading={loading}
                onDeleteTaskClick={handleDeleteTaskClick}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 0 012 2"
              ></path>
            </svg>
            <h3 className="text-xl text-gray-600 mb-2">Aucun objectif sélectionné</h3>
            <p className="text-gray-500">Sélectionnez un objectif dans la liste ou créez-en un nouveau.</p>
          </div>
        )}
      </div>

      {/* Edit Dialogs */}
      <EditObjectiveDialog
        objective={editingObjective}
        isOpen={isObjectiveDialogOpen}
        onClose={handleCloseObjectiveDialog}
        onSave={handleSaveObjective}
      />

      <EditTaskDialog
        task={editingTask}
        objectiveId={activeObjective?.id || null}
        teamMembers={teamMembers}
        isOpen={isTaskDialogOpen}
        onClose={handleCloseTaskDialog}
        onSave={handleSaveTask}
      />

      {/* Flag Dialog */}
      <FlagObjectiveDialog
        isOpen={isFlagDialogOpen}
        onClose={handleCloseFlagDialog}
        objectiveId={flaggingObjective?.id || ""}
        currentFlag={flaggingObjective?.flag}
        onSaveFlag={handleSaveFlag}
        onRemoveFlag={handleRemoveFlag}
      />

      {/* Confirmation Dialog for Objective Deletion */}
      <ConfirmationDialog
        isOpen={isDeleteObjectiveConfirmOpen}
        onClose={() => setIsDeleteObjectiveConfirmOpen(false)}
        onConfirm={handleConfirmDeleteObjective}
        title="Supprimer l'objectif"
        description="Êtes-vous sûr de vouloir supprimer cet objectif et toutes ses tâches associées ? Cette action ne peut pas être annulée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isDestructive={true}
      />

      {/* Confirmation Dialog for Task Deletion */}
      <ConfirmationDialog
        isOpen={isDeleteTaskConfirmOpen}
        onClose={() => setIsDeleteTaskConfirmOpen(false)}
        onConfirm={handleConfirmDeleteTask}
        title="Supprimer la tâche"
        description="Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action ne peut pas être annulée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isDestructive={true}
      />

      {/* Clone Dialog */}
      <CloneObjectiveDialog
        isOpen={isCloneDialogOpen}
        onClose={() => setIsCloneDialogOpen(false)}
        objective={cloningObjective}
        dataMode={dataMode}
        onSuccess={() => {
          setIsCloneDialogOpen(false)
          setCloningObjective(null)
        }}
      />
    </div>
  )
}
