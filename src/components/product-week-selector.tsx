"use client"

import { useState, useEffect, useRef } from "react"
import type { Product, WeekRange } from "@/types"
import {
  getWeekOptions,
  getCurrentWeekRange,
  formatWeekRangeFrench,
  getWeekId,
  validateWeekRange,
  debugWeekData,
} from "@/lib/date-utils"
import { Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductWeekSelectorProps {
  products: Product[]
  weekRanges: WeekRange[]
  selectedProduct: string
  selectedWeek: string
  onProductChange: (productId: string) => void
  onWeekChange: (weekRange: string, weekId: string) => void
  onError?: (error: string) => void
}

// Function to get the specific week of March 17-23, 2025
const getSpecificCurrentWeek = () => {
  const start = new Date(2025, 2, 17) // Month is 0-indexed
  const end = new Date(2025, 2, 23)
  const range = { start, end }
  const label = formatWeekRangeFrench(range)
  const id = getWeekId(start)

  return {
    id: id,
    label: label,
    range: range,
    isCurrentWeek: false, // It's not the *actual* current week
  }
}

export function ProductWeekSelector({
  products,
  weekRanges,
  selectedProduct,
  selectedWeek,
  onProductChange,
  onWeekChange,
  onError,
}: ProductWeekSelectorProps) {
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false)
  const [allWeeks2025, setAllWeeks2025] = useState<any[]>([])
  const [currentWeekLabel, setCurrentWeekLabel] = useState<string>("")
  const [currentWeekId, setCurrentWeekId] = useState<string>("")
  const [selectedWeekRange, setSelectedWeekRange] = useState<{ start: Date; end: Date } | null>(null)
  const initializedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Set mounted state to true after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate all weeks for 2025 on component mount and identify current week
  useEffect(() => {
    try {
      const weeks2025 = getWeekOptions(2025).map((week) => ({
        ...week,
        // Update the label format to "Semaine du [start] au [end]"
        label: formatWeekRangeFrench(week.range),
        originalLabel: week.label, // Keep the original label for reference
      }))

      setAllWeeks2025(weeks2025)
      setDataLoaded(true)

      // First, try to find the specific week of March 17-23, 2025
      const specificWeek = getSpecificCurrentWeek()
      const specificWeekOption = weeks2025.find((week) => week.id === specificWeek.id)

      if (specificWeekOption) {
        console.log("Found specific week (March 17-23, 2025):", specificWeekOption.label)

        // If this is the first load or no week is selected, select the specific week
        if (!initializedRef.current || !selectedWeek) {
          console.log("Initializing with specific week:", specificWeekOption.label)
          initializedRef.current = true
          onWeekChange(specificWeekOption.label, specificWeekOption.id)
          setSelectedWeekRange(specificWeekOption.range)

          // Debug the selected week data
          debugWeekData(specificWeekOption.id, specificWeekOption.label, specificWeekOption.range)
          return
        }
      } else {
        console.warn("Specific week (March 17-23, 2025) not found in options")
      }

      // If we didn't select the specific week, proceed with normal initialization
      // Find the current week
      const today = new Date()
      const currentWeek = weeks2025.find((week) => week.isCurrentWeek)

      if (currentWeek) {
        console.log("Current week found in options:", currentWeek.label)
        setCurrentWeekLabel(currentWeek.label)
        setCurrentWeekId(currentWeek.id)

        // If this is the first load or no week is selected, select the current week
        if (!initializedRef.current || !selectedWeek) {
          console.log("Initializing with current week:", currentWeek.label)
          initializedRef.current = true
          onWeekChange(currentWeek.label, currentWeek.id)
          setSelectedWeekRange(currentWeek.range)

          // Debug the selected week data
          debugWeekData(currentWeek.id, currentWeek.label, currentWeek.range)
        }
      } else {
        // Fallback to calculating current week
        console.log("Current week not found in options, calculating manually")
        const currentRange = getCurrentWeekRange()
        const formattedRange = formatWeekRangeFrench(currentRange)
        const weekId = getWeekId(today)
        setCurrentWeekLabel(formattedRange)
        setCurrentWeekId(weekId)

        // If this is the first load or no week is selected, select the current week
        if (!initializedRef.current || !selectedWeek) {
          console.log("Initializing with calculated current week:", formattedRange)
          initializedRef.current = true
          onWeekChange(formattedRange, weekId)
          setSelectedWeekRange(currentRange)

          // Debug the selected week data
          debugWeekData(weekId, formattedRange, currentRange)
        }
      }
    } catch (err) {
      console.error("Error initializing week selector:", err)
      const errorMsg = "Erreur lors de l'initialisation du sélecteur de semaine"
      setError(errorMsg)
      if (onError) onError(errorMsg)
    }
  }, [onWeekChange, selectedWeek, onError])

  // Update selectedWeekRange when selectedWeek changes
  useEffect(() => {
    if (selectedWeek && allWeeks2025.length > 0) {
      const selectedWeekData = allWeeks2025.find((week) => week.label === selectedWeek)
      if (selectedWeekData) {
        console.log("Selected week found in options:", selectedWeekData.label)
        setSelectedWeekRange(selectedWeekData.range)

        // Validate the week range
        const isValid = validateWeekRange(selectedWeekData.range)
        if (!isValid) {
          const errorMsg = "Erreur: Plage de dates de semaine invalide"
          setError(errorMsg)
          if (onError) onError(errorMsg)
          console.error("Invalid week range:", selectedWeekData.range)
        } else {
          setError(null)
        }

        // Debug the selected week data
        debugWeekData(selectedWeekData.id, selectedWeekData.label, selectedWeekData.range)
      } else {
        console.warn("Selected week not found in options:", selectedWeek)
        setSelectedWeekRange(null)
      }
    }
  }, [selectedWeek, allWeeks2025, onError])

  // Function to quickly select the current week
  const selectCurrentWeek = () => {
    if (currentWeekLabel && currentWeekId && selectedWeek !== currentWeekLabel) {
      console.log("Manually selecting current week:", currentWeekLabel)
      onWeekChange(currentWeekLabel, currentWeekId)
      const currentWeekData = allWeeks2025.find((week) => week.id === currentWeekId)
      if (currentWeekData) {
        setSelectedWeekRange(currentWeekData.range)

        // Debug the selected week data
        debugWeekData(currentWeekData.id, currentWeekData.label, currentWeekData.range)
      }
    }
    setIsWeekDropdownOpen(false)
  }

  // Check if the currently selected week is the current week (only after mount to avoid hydration issues)
  const isCurrentWeekSelected = mounted ? selectedWeek === currentWeekLabel : false

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-2" id="product-label">
            Produit
          </label>
          <button
            type="button"
            className="w-full p-2 border rounded flex justify-between items-center bg-white"
            onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
            aria-labelledby="product-label"
            aria-expanded={isProductDropdownOpen}
          >
            <span>{products.find((p) => p.id === selectedProduct)?.name || "Sélectionner un produit"}</span>
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {isProductDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg" role="listbox">
              {products.map((product) => (
                <button
                  key={product.id}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    onProductChange(product.id)
                    setIsProductDropdownOpen(false)
                  }}
                  role="option"
                  aria-selected={product.id === selectedProduct}
                >
                  {product.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium" id="week-label">
              Semaine
            </label>
            {mounted && !isCurrentWeekSelected && dataLoaded && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectCurrentWeek}
                className="flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                aria-label="Sélectionner la semaine actuelle"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Semaine actuelle</span>
              </Button>
            )}
          </div>
          <button
            type="button"
            className={`w-full p-2 border rounded flex justify-between items-center bg-white ${
              mounted && isCurrentWeekSelected ? "border-indigo-400 ring-1 ring-indigo-200 bg-indigo-50" : ""
            } ${error ? "border-red-300" : ""}`}
            onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
            aria-labelledby="week-label"
            aria-expanded={isWeekDropdownOpen}
          >
            <div className="flex items-center">
              <span>{mounted ? (selectedWeek || "Sélectionner une semaine") : "Sélectionner une semaine"}</span>
              {mounted && isCurrentWeekSelected && (
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Semaine actuelle
                </span>
              )}
            </div>
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {error && (
            <div className="mt-1 flex items-center text-sm text-red-500">
              <AlertCircle className="mr-1 h-4 w-4" />
              {error}
            </div>
          )}

          {isWeekDropdownOpen && (
            <div
              className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto"
              role="listbox"
            >
              {/* Current week quick selection option */}
              <button
                className="w-full text-left px-4 py-2 bg-indigo-50 border-b border-indigo-100 hover:bg-indigo-100 flex items-center justify-between"
                onClick={selectCurrentWeek}
                aria-label="Sélectionner la semaine actuelle"
              >
                <span className="font-medium text-indigo-700">Semaine actuelle</span>
                <Calendar className="h-4 w-4 text-indigo-600" />
              </button>

              {/* Use the generated 2025 weeks */}
              {allWeeks2025.map((week, index) => (
                <button
                  key={index}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    week.isCurrentWeek ? "bg-indigo-50 font-medium" : ""
                  } ${selectedWeek === week.label ? "bg-gray-100" : ""}`}
                  onClick={() => {
                    // Only update if the week is different from the currently selected week
                    if (selectedWeek !== week.label) {
                      console.log("Selected week from dropdown:", week.label)
                      onWeekChange(week.label, week.id)
                      setSelectedWeekRange(week.range)

                      // Debug the selected week data
                      debugWeekData(week.id, week.label, week.range)
                    }
                    setIsWeekDropdownOpen(false)
                  }}
                  role="option"
                  aria-selected={selectedWeek === week.label}
                >
                  <div className="flex items-center justify-between">
                    <span>{week.label}</span>
                    {week.isCurrentWeek && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Actuelle</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display the current period message */}
      {selectedWeekRange && (
        <div className="mt-4 text-sm text-gray-600 border-t pt-3" aria-live="polite">
          Vous visualisez les données pour la période: <span className="font-medium">{selectedWeek}</span>
        </div>
      )}
    </div>
  )
}
