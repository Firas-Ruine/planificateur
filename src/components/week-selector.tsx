"use client"

import { useState, useEffect, useRef } from "react"
import { addWeeks, subWeeks, startOfWeek, endOfWeek, isSameWeek } from "date-fns"
import { ChevronDown, Calendar, AlertCircle } from "lucide-react"
import { formatWeekRangeFrench, validateWeekRange, debugWeekData } from "@/lib/date-utils"

interface WeekSelectorProps {
  onWeekChange?: (startDate: Date, endDate: Date) => void
  initialDate?: Date
  onError?: (error: string) => void
}

export function WeekSelector({ onWeekChange, initialDate, onError }: WeekSelectorProps) {
  // Use the provided initialDate or default to current date
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [isOpen, setIsOpen] = useState(false)
  const initializedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate the start and end of the current week
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 })
  const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 })

  // Ensure time is set correctly
  startOfCurrentWeek.setHours(0, 0, 0, 0)
  endOfCurrentWeek.setHours(23, 59, 59, 999)

  // Format the week range for display in French format
  const formattedWeek = formatWeekRangeFrench({
    start: startOfCurrentWeek,
    end: endOfCurrentWeek,
  })

  // Check if the selected week is the current week
  const isCurrentWeek = isSameWeek(currentDate, new Date(), { weekStartsOn: 1 })

  // Validate the week range
  useEffect(() => {
    const weekRange = { start: startOfCurrentWeek, end: endOfCurrentWeek }
    const isValid = validateWeekRange(weekRange)

    if (!isValid) {
      const errorMsg = "Erreur: Plage de dates de semaine invalide"
      setError(errorMsg)
      if (onError) onError(errorMsg)
      console.error("Invalid week range:", weekRange)
    } else {
      setError(null)
    }

    // Debug the selected week data
    debugWeekData("current", formattedWeek, weekRange)
  }, [startOfCurrentWeek, endOfCurrentWeek, formattedWeek, onError])

  // Function to select the current week
  const selectCurrentWeek = () => {
    // Force the date to be the current date (March 24, 2025 as per requirements)
    const today = new Date(2025, 2, 24) // Month is 0-indexed, so 2 = March
    console.log("Selecting current week with date:", today.toISOString())
    handleWeekChange(today)
  }

  // Effect to automatically select the current week on mount
  useEffect(() => {
    // Only run this once on mount
    if (!initializedRef.current) {
      console.log("Automatically selecting current week on page load")

      // Set a small timeout to ensure all state is properly initialized
      setTimeout(() => {
        selectCurrentWeek()
        initializedRef.current = true
      }, 0)
    }
  }, [])

  const handleWeekChange = (newDate: Date) => {
    setCurrentDate(newDate)
    setIsOpen(false)

    if (onWeekChange) {
      const newStartOfWeek = startOfWeek(newDate, { weekStartsOn: 1 })
      const newEndOfWeek = endOfWeek(newDate, { weekStartsOn: 1 })

      // Set correct time
      newStartOfWeek.setHours(0, 0, 0, 0)
      newEndOfWeek.setHours(23, 59, 59, 999)

      console.log("Week changed:", {
        start: newStartOfWeek.toISOString(),
        end: newEndOfWeek.toISOString(),
      })
      onWeekChange(newStartOfWeek, newEndOfWeek)
    }
  }

  // Generate a range of weeks centered around the current date
  const generateWeekOptions = () => {
    const today = new Date()
    const weeks = []

    // Add weeks before current week
    for (let i = -4; i <= 4; i++) {
      const weekDate = i === 0 ? today : i < 0 ? subWeeks(today, Math.abs(i)) : addWeeks(today, i)
      const start = startOfWeek(weekDate, { weekStartsOn: 1 })
      const end = endOfWeek(weekDate, { weekStartsOn: 1 })

      // Set correct time
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      const isCurrentWeekOption = isSameWeek(weekDate, today, { weekStartsOn: 1 })

      weeks.push({
        date: weekDate,
        start,
        end,
        formatted: formatWeekRangeFrench({ start, end }),
        isCurrentWeek: isCurrentWeekOption,
      })
    }

    return weeks
  }

  const weekOptions = generateWeekOptions()

  return (
    <div className="relative">
      <div className="mb-2 font-medium">Semaine</div>
      <div className="relative">
        <button
          type="button"
          className={`flex w-full items-center justify-between rounded border ${
            isCurrentWeek ? "border-indigo-300 bg-indigo-50" : "border-gray-300 bg-white"
          } p-3 text-left ${error ? "border-red-300" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Sélectionner une semaine"
          aria-expanded={isOpen}
        >
          <span>{formattedWeek}</span>
          <ChevronDown className="h-5 w-5 text-gray-500" />
        </button>

        {error && (
          <div className="mt-1 flex items-center text-sm text-red-500">
            <AlertCircle className="mr-1 h-4 w-4" />
            {error}
          </div>
        )}

        {isCurrentWeek && (
          <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            Semaine actuelle
          </span>
        )}

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow-lg">
            {/* Current week quick selection button */}
            <button
              className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 border-b border-indigo-100 hover:bg-indigo-100 text-left"
              onClick={selectCurrentWeek}
              aria-label="Sélectionner la semaine actuelle"
            >
              <span className="font-medium text-indigo-700">Semaine actuelle</span>
              <Calendar className="h-4 w-4 text-indigo-600" />
            </button>

            <ul className="max-h-60 overflow-y-auto" role="listbox">
              {weekOptions.map((week, index) => (
                <li
                  key={index}
                  className={`cursor-pointer p-3 hover:bg-gray-100 ${
                    week.isCurrentWeek ? "bg-indigo-50 font-medium" : ""
                  }`}
                  onClick={() => handleWeekChange(week.date)}
                  role="option"
                  aria-selected={isSameWeek(week.date, currentDate, { weekStartsOn: 1 })}
                >
                  <div className="flex items-center justify-between">
                    <span>{week.formatted}</span>
                    {week.isCurrentWeek && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Actuelle</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Display the current period message */}
      <div className="mt-3 text-sm text-gray-600" aria-live="polite">
        Vous visualisez les données pour la période: <span className="font-medium">{formattedWeek}</span>
      </div>
    </div>
  )
}
