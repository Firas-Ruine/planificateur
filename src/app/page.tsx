"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppNavigation } from "@/components/layout/app-navigation"
import { ProductWeekSelector } from "@/components/product-week-selector"
import { ObjectivesView } from "@/components/features/objectives-view"
import type { Objective, Task, ViewType, Product, Member, WeekRange, Stats } from "@/types"
import {
  getProducts,
  getMembers,
  getObjectives,
  addObjective,
  deleteObjective,
  addTask,
  updateTask,
  deleteTask,
  getWeekRanges,
  getStatistics,
  initializeDefaultData,
  updateObjective,
  updateObjectivePositions,
  updateTaskPositions,
} from "@/services/firebase-service"
import {
  getMockProducts,
  getMockMembers,
  getMockWeekRanges,
  getMockObjectives,
  getMockStatistics,
  addMockObjective,
  deleteMockObjective,
  addMockTask,
  updateMockTask,
  deleteMockTask,
  updateMockObjectivePositions,
  updateMockTaskPositions,
} from "@/services/mock-data-service"
import { Loader2, Database, AlertCircle } from "lucide-react"
import { FirebaseInitializer } from "@/components/firebase-initializer"
import { FirebaseStatus } from "@/components/firebase-status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  getCurrentWeekId,
  formatWeekRangeFrench,
  getCurrentWeekRange,
  validateWeekRange,
  debugWeekData,
  getSpecificCurrentWeek,
} from "@/lib/date-utils"
import { DebugModal } from "@/components/features/debug-modal"
import dynamic from "next/dynamic"
import { findCurrentWeek } from "@/lib/date-utils"
import { useLocalStorage } from "@/hooks/use-local-storage"

// Enable debug mode for development
const DEBUG_MODE = process.env.NODE_ENV === "development"

// Dynamically import views to improve initial load time
const DynamicDashboardView = dynamic(
  () => import("@/components/features/dashboard-view").then((mod) => ({ default: mod.DashboardView })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-lg">Chargement du dashboard...</span>
      </div>
    ),
    ssr: false,
  },
)

const DynamicPlansView = dynamic(
  () => import("@/components/features/plans-view").then((mod) => ({ default: mod.PlansView })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-lg">Chargement des plans...</span>
      </div>
    ),
    ssr: false,
  },
)

// Create a type for the persisted state
interface PersistedState {
  product: string
  weekId: string
  weekLabel: string
  view: ViewType
}

export default function PlanificateurARVEA() {
  // État pour le mode de données (Firebase ou Mock)
  const [dataMode, setDataMode] = useState<"firebase" | "mock" | "loading">("loading")

  // Use a single localStorage item for all persisted state to ensure consistency
  const [persistedState, setPersistedState] = useLocalStorage<PersistedState>("planificateur-v2-state", {
    product: "",
    weekId: "",
    weekLabel: "",
    view: "objectifs",
  })

  // État pour la vue active - initialize with default to avoid hydration mismatch
  const [activeView, setActiveView] = useState<ViewType>("objectifs")

  // État pour les données
  const [products, setProducts] = useState<Product[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [weekRanges, setWeekRanges] = useState<WeekRange[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  // État pour le produit et la semaine sélectionnés - initialize with defaults to avoid hydration mismatch
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [selectedWeekId, setSelectedWeekId] = useState<string>("")
  const [selectedWeekRange, setSelectedWeekRange] = useState<{ start: Date; end: Date } | null>(null)

  // État pour l'objectif actif
  const [activeObjective, setActiveObjective] = useState<Objective | null>(null)

  // État de chargement
  const [loading, setLoading] = useState(true)
  const [loadingObjectives, setLoadingObjectives] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track when view changes to force data refresh
  const [lastViewChange, setLastViewChange] = useState<number>(0)

  // Track if component is mounted
  const [isMounted, setIsMounted] = useState(false)
  const initializedRef = useRef(false)
  const weekRangesLoadedRef = useRef(false)

  // Ref to track if we need to update persisted state
  const needsStateUpdateRef = useRef(false)

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    setLastViewChange(Date.now()) // Initialize after mount to avoid hydration mismatch
    
    // Sync state with persisted state after mount to avoid hydration mismatch
    // This ensures that user selections are preserved across page refreshes
    setActiveView(persistedState.view)
    setSelectedProduct(persistedState.product)
    setSelectedWeek(persistedState.weekLabel)
    setSelectedWeekId(persistedState.weekId)

    // Add event listener for visibility change to refresh data when tab becomes visible
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [persistedState.view, persistedState.product, persistedState.weekLabel, persistedState.weekId])

  // Update persisted state when relevant values change
  // Use a separate effect with a ref to avoid infinite loops
  useEffect(() => {
    if (!isMounted) return

    // Set flag to update state
    needsStateUpdateRef.current = true

    // Use a timeout to batch updates and avoid infinite loops
    const timeoutId = setTimeout(() => {
      if (needsStateUpdateRef.current) {
        setPersistedState({
          product: selectedProduct,
          weekId: selectedWeekId,
          weekLabel: selectedWeek,
          view: activeView,
        })
        needsStateUpdateRef.current = false
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [selectedProduct, selectedWeekId, selectedWeek, activeView, isMounted])

  // Handle visibility change to refresh data when tab becomes visible
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible" && selectedProduct && selectedWeekId) {
      // Refresh data when tab becomes visible
      console.log("Tab became visible, refreshing data")
      refreshData()
    }
  }, [selectedProduct, selectedWeekId])

  // Function to refresh data
  const refreshData = useCallback(async () => {
    if (!selectedProduct || !selectedWeekId) {
      console.warn("Cannot refresh data: missing product or week ID")
      return
    }

    try {
      setLoadingObjectives(true)
      console.log("Refreshing data for:", { product: selectedProduct, weekId: selectedWeekId })

      if (dataMode === "firebase") {
        const [objectivesData, statsData] = await Promise.all([
          getObjectives(selectedProduct, selectedWeekId),
          getStatistics(selectedProduct, selectedWeekId),
        ])

        console.log(`Loaded ${objectivesData.length} objectives from Firebase`)
        setObjectives(objectivesData)
        setStats(statsData)
      } else if (dataMode === "mock") {
        const [objectivesData, statsData] = await Promise.all([
          getMockObjectives(selectedProduct, selectedWeekId),
          getMockStatistics(selectedProduct, selectedWeekId),
        ])

        console.log(`Loaded ${objectivesData.length} objectives from mock data`)
        setObjectives(objectivesData)
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      setError("Erreur lors du chargement des données")
    } finally {
      setLoadingObjectives(false)
    }
  }, [selectedProduct, selectedWeekId, dataMode])

  // Fonction pour activer le mode mock data
  const activateMockDataMode = useCallback(() => {
    console.log("Activating mock data mode")
    setDataMode("mock")
    setLoading(true)
    setError(null)

    // Load mock data
    Promise.all([getMockProducts(), getMockMembers(), getMockWeekRanges()])
      .then(([productsData, membersData, weekRangesData]) => {
        setProducts(productsData)
        setMembers(membersData)
        setWeekRanges(weekRangesData)
        weekRangesLoadedRef.current = true

        // Set default values only if not already in persisted state
        if (productsData.length > 0 && !persistedState.product) {
          setSelectedProduct(productsData[0].id)
        }

        if (weekRangesData.length > 0) {
          // If we have stored values, find the corresponding week range
          if (persistedState.weekId && persistedState.weekLabel) {
            console.log("Using stored week selection in mock mode:", {
              weekId: persistedState.weekId,
              weekLabel: persistedState.weekLabel,
            })

            const storedWeek = weekRangesData.find((week) => week.id === persistedState.weekId)

            if (storedWeek) {
              setSelectedWeekRange({
                start: storedWeek.startDate,
                end: storedWeek.endDate,
              })

              // Debug the selected week data
              debugWeekData(selectedWeekId, selectedWeek, {
                start: storedWeek.startDate,
                end: storedWeek.endDate,
              })
            } else {
              console.warn("Stored week ID not found in available mock weeks, resetting to current week")
              resetToCurrentWeek(weekRangesData)
            }
          } else {
            // No stored week, use current week
            resetToCurrentWeek(weekRangesData)
          }
        }

        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading mock data:", err)
        setError("Erreur lors du chargement des données mock")
        setLoading(false)
      })
  }, [persistedState])

  // Helper function to reset to current week
  const resetToCurrentWeek = useCallback((weekRangesData: WeekRange[]) => {
    // Find the current week in the available week ranges
    const currentWeek = findCurrentWeek(weekRangesData)

    if (currentWeek) {
      console.log("Current week found:", currentWeek.label)
      // Format the week label in French format
      const weekLabel = formatWeekRangeFrench({
        start: currentWeek.startDate,
        end: currentWeek.endDate,
      })
      setSelectedWeek(weekLabel)
      setSelectedWeekId(currentWeek.id)
      setSelectedWeekRange({ start: currentWeek.startDate, end: currentWeek.endDate })

      // Debug the selected week data
      debugWeekData(currentWeek.id, weekLabel, {
        start: currentWeek.startDate,
        end: currentWeek.endDate,
      })
    } else {
      // If current week not found, use the current week range
      const currentRange = getCurrentWeekRange()
      const weekLabel = formatWeekRangeFrench(currentRange)
      const weekId = getCurrentWeekId()

      console.log("Using calculated current week:", weekLabel)
      setSelectedWeek(weekLabel)
      setSelectedWeekId(weekId)
      setSelectedWeekRange(currentRange)

      // Debug the selected week data
      debugWeekData(weekId, weekLabel, currentRange)
    }
  }, [])

  // Initialiser les données par défaut et charger les données de base
  useEffect(() => {
    const initializeApp = async () => {
      if (initializedRef.current || !isMounted) return
      initializedRef.current = true

      try {
        setLoading(true)
        setDataMode("loading")
        setError(null)
        console.log("Initializing application")

        // Try to initialize Firebase
        try {
          // Test Firebase connection
          await getProducts()
          setDataMode("firebase")
          console.log("Firebase connection successful")

          // Initialize default data if necessary
          await initializeDefaultData()

          // Load products, members, and weeks
          const [productsData, membersData, weekRangesData] = await Promise.all([
            getProducts(),
            getMembers(),
            getWeekRanges(),
          ])

          console.log(
            `Loaded ${productsData.length} products, ${membersData.length} members, ${weekRangesData.length} week ranges`,
          )
          setProducts(productsData)
          setMembers(membersData)
          weekRangesLoadedRef.current = true

          // Check if the specific week exists in the database
          const specificWeek = getSpecificCurrentWeek()
          const hasSpecificWeek = weekRangesData.some((week) => week.id === specificWeek.id)

          if (!hasSpecificWeek) {
            console.log("Adding specific week (March 17-23, 2025) to week ranges")
            // Add the specific week to the week ranges
            const specificWeekRange: WeekRange = {
              id: specificWeek.id,
              startDate: specificWeek.range.start,
              endDate: specificWeek.range.end,
              label: specificWeek.label,
            }

            // Add to local state
            weekRangesData.push(specificWeekRange)

            // TODO: In a real application, you would also add this to the database
            // For example: await addWeekRange(specificWeekRange)
          }

          setWeekRanges(weekRangesData)

          // Set default values only if not already selected from persisted state
          if (productsData.length > 0 && !selectedProduct) {
            setSelectedProduct(productsData[0].id)
          }

          // If we have selected values from persisted state, find the corresponding week range
          if (selectedWeekId && selectedWeek) {
            console.log("Using stored week selection:", {
              weekId: selectedWeekId,
              weekLabel: selectedWeek,
            })

            const storedWeek = weekRangesData.find((week) => week.id === selectedWeekId)

            if (storedWeek) {
              setSelectedWeekRange({
                start: storedWeek.startDate,
                end: storedWeek.endDate,
              })

              // Debug the selected week data
              debugWeekData(selectedWeekId, selectedWeek, {
                start: storedWeek.startDate,
                end: storedWeek.endDate,
              })
            } else {
              console.warn("Stored week ID not found in available weeks, resetting to current week")
              resetToDefaultWeek(weekRangesData, specificWeek)
            }
          } else {
            // No stored week, use default week
            resetToDefaultWeek(weekRangesData, specificWeek)
          }
        } catch (error) {
          console.error("Firebase initialization error:", error)
          // Don't automatically switch to mock mode, let the user decide
          setDataMode("firebase") // Still set to firebase so the error UI shows
          setError("Erreur de connexion à Firebase")
        }

        setLoading(false)
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error)
        setError("Erreur lors de l'initialisation de l'application")
        setLoading(false)
      }
    }

    initializeApp()
  }, [isMounted]) // Run when component is mounted and state is synchronized

  // Helper function to reset to default week
  const resetToDefaultWeek = useCallback(
    (weekRangesData: WeekRange[], specificWeek: any) => {
      // Prioritize selecting the specific week (March 17-23, 2025)
      const specificWeekInData = weekRangesData.find((week) => week.id === specificWeek.id)

      if (specificWeekInData) {
        console.log("Using specific week (March 17-23, 2025):", specificWeekInData.label)
        const weekLabel = formatWeekRangeFrench({
          start: specificWeekInData.startDate,
          end: specificWeekInData.endDate,
        })
        setSelectedWeek(weekLabel)
        setSelectedWeekId(specificWeekInData.id)
        setSelectedWeekRange({
          start: specificWeekInData.startDate,
          end: specificWeekInData.endDate,
        })

        // Debug the selected week data
        debugWeekData(specificWeekInData.id, weekLabel, {
          start: specificWeekInData.startDate,
          end: specificWeekInData.endDate,
        })
      } else if (weekRangesData.length > 0) {
        // Fall back to finding the current week
        resetToCurrentWeek(weekRangesData)
      }
    },
    [resetToCurrentWeek],
  )

  // Restore selectedWeekRange from stored weekId when component mounts and week ranges are loaded
  useEffect(() => {
    if (isMounted && persistedState.weekId && weekRanges.length > 0 && !selectedWeekRange) {
      const storedWeek = weekRanges.find((week) => week.id === persistedState.weekId)
      if (storedWeek) {
        setSelectedWeekRange({
          start: storedWeek.startDate,
          end: storedWeek.endDate,
        })
        console.log("Restored week range from persisted state:", {
          weekId: persistedState.weekId,
          start: storedWeek.startDate.toISOString(),
          end: storedWeek.endDate.toISOString(),
        })
      } else if (weekRangesLoadedRef.current) {
        // Only reset if week ranges have been loaded and we still can't find the stored week
        console.warn("Could not restore week range from persisted state, resetting to current week")
        resetToCurrentWeek(weekRanges)
      }
    }
  }, [isMounted, persistedState.weekId, weekRanges, selectedWeekRange, resetToCurrentWeek])

  // Charger les objectifs lorsque le produit ou la semaine change
  useEffect(() => {
    const loadObjectives = async () => {
      if (!selectedProduct || !selectedWeekId) {
        console.warn("Cannot load objectives: missing product or week ID")
        return
      }

      try {
        setLoadingObjectives(true)
        setError(null)
        console.log("Loading objectives for:", { product: selectedProduct, weekId: selectedWeekId })

        if (dataMode === "firebase") {
          // Charger les objectifs et les statistiques depuis Firebase
          const [objectivesData, statsData] = await Promise.all([
            getObjectives(selectedProduct, selectedWeekId),
            getStatistics(selectedProduct, selectedWeekId),
          ])

          console.log(`Loaded ${objectivesData.length} objectives from Firebase`)
          setObjectives(objectivesData)
          setStats(statsData)
        } else if (dataMode === "mock") {
          // Charger les objectifs et les statistiques depuis les données mock
          const [objectivesData, statsData] = await Promise.all([
            getMockObjectives(selectedProduct, selectedWeekId),
            getMockStatistics(selectedProduct, selectedWeekId),
          ])

          console.log(`Loaded ${objectivesData.length} objectives from mock data`)
          setObjectives(objectivesData)
          setStats(statsData)
        }

        setActiveObjective(null)
        setLoadingObjectives(false)
      } catch (error) {
        console.error("Erreur lors du chargement des objectifs:", error)
        setError("Erreur lors du chargement des objectifs")
        setLoadingObjectives(false)
      }
    }

    loadObjectives()
  }, [selectedProduct, selectedWeekId, dataMode, lastViewChange])

  // Gestionnaires d'événements
  const handleProductChange = useCallback((productId: string) => {
    console.log("Product changed to:", productId)
    setSelectedProduct(productId)
    setActiveObjective(null)
    setError(null)
  }, [])

  const handleWeekChange = useCallback(
    (weekRange: string, weekId: string) => {
      console.log("Week changed to:", { weekRange, weekId })
      setSelectedWeek(weekRange)
      setSelectedWeekId(weekId)
      setActiveObjective(null)
      setError(null)

      // Find the week range in the options
      const weekOption = weekRanges.find((week) => week.id === weekId)
      if (weekOption) {
        setSelectedWeekRange({ start: weekOption.startDate, end: weekOption.endDate })

        // Debug the selected week data
        debugWeekData(weekId, weekRange, { start: weekOption.startDate, end: weekOption.endDate })
      } else {
        console.warn("Selected week not found in week ranges:", weekId)
        setSelectedWeekRange(null)
      }
    },
    [weekRanges],
  )

  // Handle view change to force data refresh
  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view)
    // We don't need to force a refresh here
  }, [])

  // Handle errors from child components
  const handleError = useCallback((errorMessage: string) => {
    console.error("Error reported from child component:", errorMessage)
    setError(errorMessage)
  }, [])

  const handleAddObjective = useCallback(
    async (objectiveInput: string | { title: string; category?: string }) => {
      // Extract the title - handle both string and object inputs
      const title = typeof objectiveInput === "string" ? objectiveInput : objectiveInput.title

      if (!title || !title.trim()) return undefined

      try {
        const newObjectiveData = {
          productId: selectedProduct,
          weekId: selectedWeekId,
          title: title.trim(),
          progress: 0,
          // Add optional category if provided
          ...(typeof objectiveInput !== "string" && objectiveInput.category
            ? { category: objectiveInput.category }
            : {}),
          // Add default values for new fields
          isUrgent: true,
          isImportant: true,
        }

        let objectiveId: string

        if (dataMode === "firebase") {
          objectiveId = await addObjective(newObjectiveData)
        } else {
          objectiveId = await addMockObjective(newObjectiveData)
        }

        const newObjective: Objective = {
          id: objectiveId,
          ...newObjectiveData,
          tasks: [],
          position: 0, // Ensure position is defined
        }

        setObjectives((prev) => [...prev, newObjective])
        setActiveObjective(newObjective)

        // Mettre à jour les statistiques
        let statsData: Stats

        if (dataMode === "firebase") {
          statsData = await getStatistics(selectedProduct, selectedWeekId)
        } else {
          statsData = await getMockStatistics(selectedProduct, selectedWeekId)
        }

        setStats(statsData)

        return newObjective
      } catch (error) {
        console.error("Erreur lors de l'ajout d'un objectif:", error)
        return undefined
      }
    },
    [selectedProduct, selectedWeekId, dataMode],
  )

  const handleDeleteObjective = useCallback(
    async (objectiveId: string) => {
      try {
        if (dataMode === "firebase") {
          await deleteObjective(objectiveId)
        } else {
          await deleteMockObjective(objectiveId)
        }

        setObjectives((prev) => prev.filter((obj) => obj.id !== objectiveId))

        if (activeObjective && activeObjective.id === objectiveId) {
          setActiveObjective(null)
        }

        // Mettre à jour les statistiques
        let statsData: Stats

        if (dataMode === "firebase") {
          statsData = await getStatistics(selectedProduct, selectedWeekId)
        } else {
          statsData = await getMockStatistics(selectedProduct, selectedWeekId)
        }

        setStats(statsData)
      } catch (error) {
        console.error("Erreur lors de la suppression d'un objectif:", error)
      }
    },
    [activeObjective, selectedProduct, selectedWeekId, dataMode],
  )

  const handleAddTask = useCallback(
    async (objectiveId: string, task: Omit<Task, "id" | "objectiveId" | "completed">) => {
      if (!task.title.trim()) return null

      try {
        const newTaskData = {
          ...task,
          objectiveId,
          completed: false,
        }

        let taskId: string

        if (dataMode === "firebase") {
          taskId = await addTask(newTaskData)
        } else {
          taskId = await addMockTask(newTaskData)
        }

        const newTask: Task = {
          id: taskId,
          ...newTaskData,
        }

        // Mettre à jour l'état local
        setObjectives((prev) => {
          return prev.map((obj) => {
            if (obj.id === objectiveId) {
              return {
                ...obj,
                tasks: [...obj.tasks, newTask],
              }
            }
            return obj
          })
        })

        // Mettre à jour l'objectif actif si nécessaire
        if (activeObjective && activeObjective.id === objectiveId) {
          let updatedObjective: Objective | undefined

          if (dataMode === "firebase") {
            updatedObjective = await getObjectives(selectedProduct, selectedWeekId).then((objectives) =>
              objectives.find((obj) => obj.id === objectiveId),
            )
          } else {
            updatedObjective = await getMockObjectives(selectedProduct, selectedWeekId).then((objectives) =>
              objectives.find((obj) => obj.id === objectiveId),
            )
          }

          if (updatedObjective) {
            setActiveObjective(updatedObjective)
          }
        }

        // Mettre à jour les statistiques
        let statsData: Stats

        if (dataMode === "firebase") {
          statsData = await getStatistics(selectedProduct, selectedWeekId)
        } else {
          statsData = await getMockStatistics(selectedProduct, selectedWeekId)
        }

        setStats(statsData)

        return newTask
      } catch (error) {
        console.error("Erreur lors de l'ajout d'une tâche:", error)
        return null
      }
    },
    [activeObjective, selectedProduct, selectedWeekId, dataMode],
  )

  const handleDeleteTask = useCallback(
    async (objectiveId: string, taskId: string) => {
      try {
        if (dataMode === "firebase") {
          await deleteTask(taskId)
        } else {
          await deleteMockTask(taskId)
        }

        // Mettre à jour l'état local
        setObjectives((prev) => {
          return prev.map((obj) => {
            if (obj.id === objectiveId) {
              return {
                ...obj,
                tasks: obj.tasks.filter((task) => task.id !== taskId),
              }
            }
            return obj
          })
        })

        // Mettre à jour l'objectif actif si nécessaire
        if (activeObjective && activeObjective.id === objectiveId) {
          let updatedObjective: Objective | undefined

          if (dataMode === "firebase") {
            updatedObjective = await getObjectives(selectedProduct, selectedWeekId).then((objectives) =>
              objectives.find((obj) => obj.id === objectiveId),
            )
          } else {
            updatedObjective = await getMockObjectives(selectedProduct, selectedWeekId).then((objectives) =>
              objectives.find((obj) => obj.id === objectiveId),
            )
          }

          if (updatedObjective) {
            setActiveObjective(updatedObjective)
          }
        }

        // Mettre à jour les statistiques
        let statsData: Stats

        if (dataMode === "firebase") {
          statsData = await getStatistics(selectedProduct, selectedWeekId)
        } else {
          statsData = await getMockStatistics(selectedProduct, selectedWeekId)
        }

        setStats(statsData)
      } catch (error) {
        console.error("Erreur lors de la suppression d'une tâche:", error)
      }
    },
    [activeObjective, selectedProduct, selectedWeekId, dataMode],
  )

  const handleToggleTaskCompletion = useCallback(
    async (objectiveId: string, taskId: string) => {
      try {
        // Trouver la tâche actuelle
        const objective = objectives.find((obj) => obj.id === objectiveId)
        if (!objective) return

        const task = objective.tasks.find((t) => t.id === taskId)
        if (!task) return

        // Inverser le statut de complétion
        const newCompletionStatus = !task.completed

        if (dataMode === "firebase") {
          await updateTask(taskId, { completed: newCompletionStatus })
        } else {
          await updateMockTask(taskId, { completed: newCompletionStatus })
        }

        // Mettre à jour l'état local
        setObjectives((prev) => {
          return prev.map((obj) => {
            if (obj.id === objectiveId) {
              // Update the tasks
              const updatedTasks = obj.tasks.map((t) => {
                if (t.id === taskId) {
                  return { ...t, completed: newCompletionStatus }
                }
                return t
              })

              // Recalculate progress immediately
              const completedTasks = updatedTasks.filter((t) => t.completed).length
              const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0

              return {
                ...obj,
                tasks: updatedTasks,
                progress: progress,
              }
            }
            return obj
          })
        })

        // Mettre à jour l'objectif actif si nécessaire
        if (activeObjective && activeObjective.id === objectiveId) {
          let updatedObjective: Objective | undefined

          if (dataMode === "firebase") {
            updatedObjective = await getObjectives(selectedProduct, selectedWeekId).then((objectives) =>
              objectives.find((obj) => obj.id === objectiveId),
            )
          } else {
            updatedObjective = await getMockObjectives(selectedProduct, selectedWeekId).then((objectives) =>
              objectives.find((obj) => obj.id === objectiveId),
            )
          }

          if (updatedObjective) {
            setActiveObjective(updatedObjective)
          }
        }

        // Mettre à jour les statistiques
        let statsData: Stats

        if (dataMode === "firebase") {
          statsData = await getStatistics(selectedProduct, selectedWeekId)
        } else {
          statsData = await getMockStatistics(selectedProduct, selectedWeekId)
        }

        setStats(statsData)
      } catch (error) {
        console.error("Erreur lors de la modification d'une tâche:", error)
      }
    },
    [objectives, activeObjective, selectedProduct, selectedWeekId, dataMode],
  )

  const handleUpdateObjective = useCallback(
    async (objectiveId: string, updates: Partial<Objective>) => {
      try {
        // Update local state immediately for real-time feedback
        setObjectives((prev) => {
          return prev.map((obj) => {
            if (obj.id === objectiveId) {
              return { ...obj, ...updates }
            }
            return obj
          })
        })

        // Update the active objective if necessary
        if (activeObjective && activeObjective.id === objectiveId) {
          setActiveObjective((prev) => (prev ? { ...prev, ...updates } : null))
        }

        // Then update the backend
        if (dataMode === "firebase") {
          await updateObjective(objectiveId, updates)
        }

        // No need to fetch the entire list again, we've already updated the state
      } catch (error) {
        console.error("Erreur lors de la mise à jour d'un objectif:", error)
      }
    },
    [dataMode, activeObjective],
  )

  const handleUpdateTask = useCallback(
    async (objectiveId: string, taskId: string, updates: Partial<Task>) => {
      try {
        if (dataMode === "firebase") {
          await updateTask(taskId, updates)
        } else {
          // For mock mode, we'll update the objectives state directly
          setObjectives((prev) => {
            return prev.map((obj) => {
              if (obj.id === objectiveId) {
                const updatedTasks = obj.tasks.map((task) => {
                  if (task.id === taskId) {
                    return { ...task, ...updates }
                  }
                  return task
                })
                return { ...obj, tasks: updatedTasks }
              }
              return obj
            })
          })
        }

        // Update the active objective if necessary
        if (activeObjective && activeObjective.id === objectiveId) {
          setActiveObjective((prev) => {
            if (!prev) return null

            const updatedTasks = prev.tasks.map((task) => {
              if (task.id === taskId) {
                return { ...task, ...updates }
              }
              return task
            })

            return { ...prev, tasks: updatedTasks }
          })
        }

        // Update statistics
        let statsData: Stats
        if (dataMode === "firebase") {
          statsData = await getStatistics(selectedProduct, selectedWeekId)
        } else {
          statsData = await getMockStatistics(selectedProduct, selectedWeekId)
        }
        setStats(statsData)
      } catch (error) {
        console.error("Erreur lors de la mise à jour d'une tâche:", error)
      }
    },
    [dataMode, activeObjective, selectedProduct, selectedWeekId],
  )

  // New handlers for reordering objectives and tasks
  const handleObjectivesReordered = useCallback(
    async (reorderedObjectives: Objective[]) => {
      try {
        // Update the global state with the new order
        setObjectives(reorderedObjectives)

        // Persist the new order to the database
        if (dataMode === "firebase") {
          await updateObjectivePositions(reorderedObjectives)
        } else {
          await updateMockObjectivePositions(reorderedObjectives)
        }

        console.log("Objective positions updated successfully")
      } catch (error) {
        console.error("Error persisting objective positions:", error)
        // You could show a toast notification here if the persistence fails
      }
    },
    [dataMode],
  )

  const handleTasksReordered = useCallback(
    async (objectiveId: string, reorderedTasks: Task[]) => {
      try {
        // Update the global state with the new task order
        setObjectives((prev) => {
          return prev.map((obj) => {
            if (obj.id === objectiveId) {
              return {
                ...obj,
                tasks: reorderedTasks,
              }
            }
            return obj
          })
        })

        // Persist the new task order to the database
        if (dataMode === "firebase") {
          await updateTaskPositions(reorderedTasks)
        } else {
          await updateMockTaskPositions(reorderedTasks)
        }

        console.log("Task positions updated successfully")
      } catch (error) {
        console.error("Error persisting task positions:", error)
        // You could show a toast notification here if the persistence fails
      }
    },
    [dataMode],
  )

  // Memoize the active view component to prevent unnecessary re-renders
  const activeViewComponent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-lg">Chargement...</span>
        </div>
      )
    }

    switch (activeView) {
      case "objectifs":
        return (
          <ObjectivesView
            objectives={objectives}
            activeObjective={activeObjective}
            teamMembers={members}
            loading={loadingObjectives}
            dataMode={dataMode}
            onAddObjective={handleAddObjective}
            onDeleteObjective={handleDeleteObjective}
            onSelectObjective={setActiveObjective}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onToggleTaskCompletion={handleToggleTaskCompletion}
            onUpdateObjective={handleUpdateObjective}
            onUpdateTask={handleUpdateTask}
          />
        )
      case "dashboard":
        return (
          <DynamicDashboardView
            objectives={objectives}
            teamMembers={members}
            stats={stats}
            loading={loadingObjectives}
            selectedWeek={selectedWeek} // Add this prop
            onObjectivesReordered={handleObjectivesReordered}
            onTasksReordered={handleTasksReordered}
          />
        )
      case "plans":
        return (
          <DynamicPlansView
            objectives={objectives}
            teamMembers={members}
            productName={products.find((p) => p.id === selectedProduct)?.name || ""}
            weekRange={selectedWeek}
            loading={loadingObjectives}
          />
        )
      default:
        return null
    }
  }, [
    loading,
    activeView,
    objectives,
    activeObjective,
    members,
    loadingObjectives,
    stats,
    products,
    selectedProduct,
    selectedWeek,
    handleAddObjective,
    handleDeleteObjective,
    handleAddTask,
    handleDeleteTask,
    handleToggleTaskCompletion,
    handleUpdateObjective,
    handleUpdateTask,
    handleObjectivesReordered,
    handleTasksReordered,
  ])

  return (
    <div className="bg-gray-100 min-h-screen">
      <AppHeader />
      <div suppressHydrationWarning>
        <AppNavigation activeView={activeView} onChangeView={handleViewChange} />
      </div>

      <main className="max-w-6xl mx-auto p-4">
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {dataMode === "mock" && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Database className="h-4 w-4 text-blue-500" />
            <AlertTitle>Using Mock Data</AlertTitle>
            <AlertDescription>
              You are currently using mock data. Firebase connection is not available.
            </AlertDescription>
          </Alert>
        )}

        <ProductWeekSelector
          products={products}
          weekRanges={weekRanges}
          selectedProduct={selectedProduct}
          selectedWeek={selectedWeek}
          onProductChange={handleProductChange}
          onWeekChange={handleWeekChange}
          onError={handleError}
        />

        {DEBUG_MODE && selectedWeekRange && (
          <div className="mb-4 p-3 bg-gray-50 border rounded text-xs font-mono">
            <div>Debug: Selected Week Data</div>
            <div>ID: {selectedWeekId}</div>
            <div>Label: {selectedWeek}</div>
            <div>Start: {selectedWeekRange.start.toISOString()}</div>
            <div>End: {selectedWeekRange.end.toISOString()}</div>
            <div>Valid: {validateWeekRange(selectedWeekRange) ? "Yes" : "No"}</div>
          </div>
        )}

        {products.length === 0 && dataMode === "firebase" && (
          <div className="mb-6">
            <FirebaseStatus onUseFallback={activateMockDataMode} />
            <FirebaseInitializer />
          </div>
        )}

        {activeViewComponent}
      </main>
      {process.env.NODE_ENV === "development" && <DebugModal />}
    </div>
  )
}
