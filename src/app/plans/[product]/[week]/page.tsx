"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PlansView } from "@/components/features/plans-view"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import type { Objective, Member } from "@/types"
import { getProducts, getMembers, getObjectives } from "@/services/firebase-service"
import { getWeekOptions, getWeekId, getCurrentWeekRange, formatDateRange } from "@/lib/date-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

// Maximum time to wait for data loading before showing a timeout error
const LOADING_TIMEOUT_MS = 30000 // 30 seconds

export default function PlansPage({
  params,
}: {
  params: { product: string; week: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [teamMembers, setTeamMembers] = useState<Member[]>([])
  const [productName, setProductName] = useState("")
  const [weekRange, setWeekRange] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [error, setError] = useState<string | null>(null)
  const [timeoutError, setTimeoutError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Function to handle retry
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setTimeoutError(false)

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error("Loading timeout reached")
        setTimeoutError(true)
        setLoading(false)
      }, LOADING_TIMEOUT_MS)

      const debug: any = {
        params,
        timestamp: new Date().toISOString(),
        retryCount,
      }

      // Get all products
      const products = await getProducts()
      debug.products = products.map((p) => ({ id: p.id, name: p.name }))

      // Find the product by ID
      const product = products.find((p) => p.id === params.product)
      if (!product) {
        router.push("/plans")
        clearTimeout(timeoutId)
        return
      }
      debug.product = { id: product.id, name: product.name }

      setProductName(product.name)

      // Get week options
      const weekOptions = getWeekOptions()
      debug.weekOptions = weekOptions.map((w) => ({ id: w.id, label: w.label }))

      // Find the week by ID or use current week
      let week
      let weekId

      if (params.week === "current-week") {
        const currentWeekRange = getCurrentWeekRange()
        weekId = getWeekId(new Date()) // Get the actual week ID for the current week
        week = {
          id: weekId, // Use the actual week ID, not "current-week"
          label: formatDateRange(currentWeekRange),
          range: currentWeekRange,
        }
        debug.usingCurrentWeek = true
        debug.currentWeekId = weekId
      } else {
        week = weekOptions.find((w) => w.id === params.week)
        weekId = params.week
      }

      if (!week) {
        router.push(`/plans/${params.product}/current-week`)
        clearTimeout(timeoutId)
        return
      }

      debug.week = { id: week.id, label: week.label }
      debug.weekId = weekId

      setWeekRange(week.label)

      // Get objectives and team members
      try {
        console.log(`Fetching objectives for product ${product.id} and week ${weekId}`)
        const [objectivesData, membersData] = await Promise.all([getObjectives(product.id, weekId), getMembers()])

        debug.objectivesCount = objectivesData.length
        debug.membersCount = membersData.length

        // Log the full objectives data for debugging
        debug.objectivesData = objectivesData.map((obj) => ({
          id: obj.id,
          title: obj.title,
          progress: obj.progress,
          weekId: obj.weekId,
          taskCount: obj.tasks.length,
          taskIds: obj.tasks.map((t) => t.id),
        }))

        setObjectives(objectivesData)
        setTeamMembers(membersData)
        setDebugInfo(debug)
        setLoading(false)
        clearTimeout(timeoutId)
      } catch (dataError) {
        console.error("Error fetching objectives or members:", dataError)
        debug.dataError = dataError.message
        setError("Erreur lors du chargement des objectifs ou des membres")
        setDebugInfo(debug)
        setLoading(false)
        clearTimeout(timeoutId)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Une erreur est survenue lors du chargement des données")
      setLoading(false)
    }
  }, [params.product, params.week, router, retryCount])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (timeoutError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de délai d'attente</AlertTitle>
          <AlertDescription>
            Le chargement du plan a pris trop de temps. Veuillez réessayer ou contacter l'administrateur si le problème
            persiste.
            <div className="mt-4 flex gap-4">
              <Button
                onClick={handleRetry}
                className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Réessayer
              </Button>
              <a href="/" className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
                Retour à l'accueil
              </a>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Chargement du plan...</h2>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter pendant que nous récupérons les données...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4 flex gap-4">
              <Button
                onClick={handleRetry}
                className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Réessayer
              </Button>
              <a href="/" className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
                Retour à l'accueil
              </a>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PlansView
        objectives={objectives}
        teamMembers={teamMembers}
        productName={productName}
        weekRange={weekRange}
        weekId={params.week === "current-week" ? debugInfo.currentWeekId : params.week} // Pass the weekId
        loading={false}
        debugInfo={debugInfo}
      />
    </div>
  )
}
