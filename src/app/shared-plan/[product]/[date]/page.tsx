"use client"

import { useEffect, useState, useCallback } from "react"
import { PlansView } from "@/components/features/plans-view"
import { notFound, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import type { Objective, Member, WeekRange as WeekRangeType } from "@/types"
import { getProducts, getMembers, getObjectives, getWeekRanges } from "@/services/firebase-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatDate, getSpecificCurrentWeek, parseSharedPlanDateFormat, getWeekId } from "@/lib/date-utils"

// Maximum time to wait for data loading before showing a timeout error
const LOADING_TIMEOUT_MS = 30000 // 30 seconds

export default function SharedPlanPage({
  params,
}: {
  params: { product: string; date: string }
}) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [teamMembers, setTeamMembers] = useState<Member[]>([])
  const [productName, setProductName] = useState("")
  const [weekRange, setWeekRange] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notFoundError, setNotFoundError] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [timeoutError, setTimeoutError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // Function to handle retry
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1)
  }, [])

  // Helper function to find a product by name using multiple strategies
  const findProductByName = useCallback((products: any[], searchName: string) => {
    // Strategy 1: Exact match (case insensitive)
    let product = products.find((p) => p.name.toLowerCase() === searchName.toLowerCase())

    // Strategy 2: URL-friendly version match
    if (!product) {
      product = products.find((p) => {
        const urlFriendlyName = p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim()
          .replace(/\s+/g, " ")
        return urlFriendlyName === searchName.toLowerCase()
      })
    }

    // Strategy 3: Contains match
    if (!product) {
      product = products.find(
        (p) =>
          p.name.toLowerCase().includes(searchName.toLowerCase()) ||
          searchName.toLowerCase().includes(p.name.toLowerCase()),
      )
    }

    // Strategy 4: Match by words
    if (!product) {
      const searchWords = searchName.toLowerCase().split(/\s+/)
      product = products.find((p) => {
        const productWords = p.name.toLowerCase().split(/\s+/)
        return searchWords.some((word) => productWords.includes(word))
      })
    }

    // Strategy 5: Match by ID as a last resort
    if (!product) {
      product = products.find((p) => p.id.toLowerCase() === searchName.toLowerCase())
    }

    return product
  }, [])

  // Helper function to find the exact week range by dates
  const findExactWeekRange = useCallback(
    (weekRanges: WeekRangeType[], targetStart: Date, targetEnd: Date): WeekRangeType | null => {
      // First try exact match by comparing formatted dates
      const targetStartFormatted = formatDate(targetStart)
      const targetEndFormatted = formatDate(targetEnd)

      // Try to find a week with exactly matching label
      const exactLabelMatch = weekRanges.find((week) => {
        const [weekStartStr, weekEndStr] = week.label.split(" - ")
        return weekStartStr === targetStartFormatted && weekEndStr === targetEndFormatted
      })

      if (exactLabelMatch) return exactLabelMatch

      // Try to find a week with matching dates
      return weekRanges.find((week) => isSameDay(week.startDate, targetStart) && isSameDay(week.endDate, targetEnd))
    },
    [],
  )

  // Helper function to check if two dates represent the same day
  const isSameDay = useCallback((date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }, [])

  // Parse member filter from URL
  useEffect(() => {
    const membersParam = searchParams.get("members")
    if (membersParam) {
      const memberIds = membersParam.split(",")
      // Only update state if the member IDs have actually changed
      if (JSON.stringify(memberIds) !== JSON.stringify(selectedMembers)) {
        setSelectedMembers(memberIds)
        console.log("Parsed member filters from URL:", memberIds)
      }
    } else if (selectedMembers.length > 0) {
      // Only reset if we currently have selected members
      setSelectedMembers([])
    }
  }, [searchParams, selectedMembers])

  // Main data fetching function
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

      // Properly decode the URL parameters
      const decodedProduct = decodeURIComponent(params.product)
      debug.decodedProduct = decodedProduct
      console.log("Decoded product:", decodedProduct)

      // Parse the date format
      if (!params.date.includes("--to--")) {
        console.error("Invalid date format in URL:", params.date)
        setError("Format de date invalide dans l'URL")
        setLoading(false)
        clearTimeout(timeoutId)
        return
      }

      // Parse the dates from the URL
      const parsedDates = parseSharedPlanDateFormat(params.date)
      if (!parsedDates) {
        console.error("Failed to parse dates from URL:", params.date)
        setError("Format de date invalide")
        setLoading(false)
        clearTimeout(timeoutId)
        return
      }

      debug.parsedDates = {
        start: parsedDates.start.toISOString(),
        end: parsedDates.end.toISOString(),
      }

      // Format the week range for display
      const [startDateStr, endDateStr] = params.date.split("--to--")
      const formattedWeekRange = `${startDateStr.replace(/-/g, "/")} - ${endDateStr.replace(/-/g, "/")}`
      const frenchFormattedWeekRange = `Semaine du ${startDateStr.replace(/-/g, "/")} au ${endDateStr.replace(/-/g, "/")}`

      debug.formattedWeekRange = formattedWeekRange
      debug.frenchFormattedWeekRange = frenchFormattedWeekRange

      // Set the week range for display
      setWeekRange(frenchFormattedWeekRange)

      try {
        // Get all products
        const products = await getProducts()
        debug.availableProducts = products.map((p) => ({ id: p.id, name: p.name }))

        // Find the product using multiple matching strategies
        const product = findProductByName(products, decodedProduct)
        if (!product) {
          console.error("Product not found:", decodedProduct)
          setError(`Produit non trouvé: ${decodedProduct}`)
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }
        debug.matchedProduct = { id: product.id, name: product.name }
        console.log("Found product:", product.name, product.id)
        setProductName(product.name)

        // Get week ranges
        const weekRanges = await getWeekRanges()
        debug.availableWeekRanges = weekRanges.map((w) => ({
          id: w.id,
          label: w.label,
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
        }))

        // Find the exact week range that matches our dates
        const weekRange = findExactWeekRange(weekRanges, parsedDates.start, parsedDates.end)

        // Generate a week ID from the start date
        const weekId = getWeekId(parsedDates.start)
        debug.generatedWeekId = weekId

        // Check if this is the specific week (March 17-23, 2025)
        const specificWeek = getSpecificCurrentWeek()
        const isSpecificWeek =
          isSameDay(parsedDates.start, specificWeek.range.start) && isSameDay(parsedDates.end, specificWeek.range.end)

        debug.isSpecificWeek = isSpecificWeek
        debug.specificWeek = {
          id: specificWeek.id,
          label: specificWeek.label,
          range: {
            start: specificWeek.range.start.toISOString(),
            end: specificWeek.range.end.toISOString(),
          },
        }

        // Determine the week ID to use
        let finalWeekId: string

        if (weekRange) {
          finalWeekId = weekRange.id
          debug.matchedWeekRange = {
            id: weekRange.id,
            label: weekRange.label,
            startDate: weekRange.startDate.toISOString(),
            endDate: weekRange.endDate.toISOString(),
          }
          console.log("Found week range:", weekRange.label, weekRange.id)
        } else if (isSpecificWeek) {
          finalWeekId = specificWeek.id
          debug.usingSpecificWeek = true
          console.log("Using specific week (March 17-23, 2025):", specificWeek.id)
        } else {
          finalWeekId = weekId
          debug.usingGeneratedWeekId = true
          console.log("Using generated week ID:", weekId)
        }

        // Fetch team members
        const membersData = await getMembers()

        // Fetch objectives using the determined week ID
        console.log(`Fetching objectives for product ${product.id} and week ${finalWeekId}`)
        const objectivesData = await getObjectives(product.id, finalWeekId)

        debug.objectivesCount = objectivesData.length
        debug.objectiveIds = objectivesData.map((obj) => obj.id)
        console.log(`Found ${objectivesData.length} objectives for product ${product.id} and week ${finalWeekId}`)

        // Log the full objectives data for debugging
        debug.objectivesData = objectivesData.map((obj) => ({
          id: obj.id,
          title: obj.title,
          progress: obj.progress,
          weekId: obj.weekId,
          taskCount: obj.tasks.length,
          taskIds: obj.tasks.map((t) => t.id),
        }))

        // Set the state with the fetched data
        setObjectives(objectivesData)
        setTeamMembers(membersData)
        setDebugInfo(debug)
        setLoading(false)
        clearTimeout(timeoutId)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Une erreur est survenue lors du chargement des données")
        setDebugInfo({
          ...debug,
          error: error.message,
          stack: error.stack,
        })
        setLoading(false)
        clearTimeout(timeoutId)
      }
    } catch (error) {
      console.error("Error in fetchData:", error)
      setError("Une erreur est survenue lors du chargement des données")
      setLoading(false)
    }
  }, [findExactWeekRange, findProductByName, isSameDay, params.date, retryCount, params.product, params.product])

  // Effect to fetch data when component mounts or params change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (notFoundError) {
    notFound()
  }

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
        weekId={debugInfo.generatedWeekId || debugInfo.matchedWeekRange?.id || debugInfo.specificWeek?.id} // Pass the weekId
        loading={false}
        debugInfo={debugInfo}
        isSharedView={true}
        initialSelectedMembers={selectedMembers} // Pass the selected members from URL
      />
    </div>
  )
}
