import { format, startOfWeek, isSameWeek, isSameDay as isSameDayFns, isValid } from "date-fns"
import { fr } from "date-fns/locale"

// Debug helper to log date operations
const DEBUG_DATES = false
function logDateDebug(message: string, ...args: any[]) {
  if (DEBUG_DATES) {
    console.log(`[DATE-DEBUG] ${message}`, ...args)
  }
}

export function formatDate(date: Date): string {
  if (!isValid(date)) {
    console.warn("Invalid date provided to formatDate:", date)
    return "Invalid date"
  }
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
}

export function getCurrentWeekRange(): { start: Date; end: Date } {
  // Use the specific week from March 24-30, 2025 as the current week
  const specificWeek = getSpecificCurrentWeek()
  return specificWeek.range
}

// Add a new function for French date formatting
export function formatDateFrench(date: Date): string {
  if (!isValid(date)) {
    console.warn("Invalid date provided to formatDateFrench:", date)
    return "Invalid date"
  }
  return format(date, "dd/MM/yyyy", { locale: fr })
}

// Add a function to format the week range in French
export function formatWeekRangeFrench({ start, end }: { start: Date; end: Date }): string {
  if (!isValid(start) || !isValid(end)) {
    console.warn("Invalid date range provided to formatWeekRangeFrench:", { start, end })
    return "Invalid date range"
  }
  return `Semaine du ${formatDateFrench(start)} au ${formatDateFrench(end)}`
}

// Update the existing formatDateRange function to use the French locale
export function formatDateRange({ start, end }: { start: Date; end: Date }): string {
  if (!isValid(start) || !isValid(end)) {
    console.warn("Invalid date range provided to formatDateRange:", { start, end })
    return "Invalid date range"
  }
  return `${formatDateFrench(start)} - ${formatDateFrench(end)}`
}

export function getWeekOptions(
  year = 2025,
): { label: string; value: string; range: { start: Date; end: Date }; id: string; isCurrentWeek: boolean }[] {
  const options = []
  logDateDebug(`Generating week options for year ${year}`)

  try {
    // Get the first Monday of the year
    const firstDay = new Date(year, 0, 1) // January 1st of the specified year
    if (!isValid(firstDay)) {
      throw new Error(`Invalid first day of year ${year}`)
    }

    const dayOfWeek = firstDay.getDay()
    const daysToAdd = dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 1 : 8 - dayOfWeek

    const firstMonday = new Date(firstDay)
    firstMonday.setDate(firstDay.getDate() + daysToAdd)
    if (!isValid(firstMonday)) {
      throw new Error(`Invalid first Monday of year ${year}`)
    }

    // Generate all weeks for the year
    const currentWeekRange = getCurrentWeekRange()
    const today = new Date()

    const weekStart = new Date(firstMonday)

    while (weekStart.getFullYear() === year) {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999) // End of day

      if (!isValid(weekEnd)) {
        console.warn(`Invalid week end date generated for ${weekStart.toISOString()}`)
        // Skip this week and continue
        weekStart.setDate(weekStart.getDate() + 7)
        continue
      }

      const range = { start: new Date(weekStart), end: new Date(weekEnd) }
      const label = formatWeekRangeFrench(range)

      // Create a unique ID for the week based on its date
      const weekId = `week-${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`

      // Check if this is the current week - more robust check using date-fns
      const isCurrentWeek = isSameWeek(today, weekStart, { weekStartsOn: 1 })

      if (isCurrentWeek) {
        logDateDebug(`Found current week: ${label}, ID: ${weekId}`)
      }

      options.push({
        label,
        value: label,
        range,
        id: weekId, // Add ID to the options
        isCurrentWeek: isCurrentWeek,
      })

      // Move to next week
      weekStart.setDate(weekStart.getDate() + 7)
    }

    // Ensure we have the specific week of March 24-30, 2025
    const specificWeek = getSpecificCurrentWeek()
    const hasSpecificWeek = options.some(
      (week) =>
        week.id === specificWeek.id ||
        (isSameDay(week.range.start, specificWeek.range.start) && isSameDay(week.range.end, specificWeek.range.end)),
    )

    if (!hasSpecificWeek) {
      logDateDebug(`Adding specific week (March 24-30, 2025) as it wasn't found in options`)
      options.push({
        label: specificWeek.label,
        value: specificWeek.label,
        range: specificWeek.range,
        id: specificWeek.id,
        isCurrentWeek: false, // This is not the actual current week
      })
    }

    return options
  } catch (error) {
    console.error("Error generating week options:", error)
    return []
  }
}

// Update the getWeekId function to ensure consistent ID generation
export function getWeekId(date: Date): string {
  if (!isValid(date)) {
    console.warn("Invalid date provided to getWeekId:", date)
    // Return a fallback week ID for the specific current week
    const specificWeek = getSpecificCurrentWeek()
    return specificWeek.id
  }

  try {
    // Use date-fns to get the start of the week
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    if (!isValid(weekStart)) {
      throw new Error("Invalid week start date")
    }

    // Format: week-YYYY-MM-DD
    return `week-${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`
  } catch (error) {
    console.error("Error in getWeekId:", error)
    // Return a fallback week ID for the specific current week
    const specificWeek = getSpecificCurrentWeek()
    return specificWeek.id
  }
}

// Add a new function to find the closest week to a given date
export function findClosestWeek(weekRanges: any[], targetDate: Date = new Date()): any | null {
  if (!weekRanges || weekRanges.length === 0) return null
  if (!isValid(targetDate)) {
    console.warn("Invalid target date provided to findClosestWeek:", targetDate)
    return null
  }

  logDateDebug(`Finding closest week to date: ${targetDate.toISOString()}`)

  try {
    // Sort weeks by how close their start date is to the target date
    const sortedWeeks = [...weekRanges].sort((a, b) => {
      if (!isValid(a.startDate) || !isValid(b.startDate)) {
        throw new Error("Invalid date in week range")
      }

      const distanceA = Math.abs(a.startDate.getTime() - targetDate.getTime())
      const distanceB = Math.abs(b.startDate.getTime() - targetDate.getTime())
      return distanceA - distanceB
    })

    if (sortedWeeks.length > 0) {
      logDateDebug(`Closest week found: ${sortedWeeks[0].label || "unnamed"}`)
    }

    return sortedWeeks[0]
  } catch (error) {
    console.error("Error in findClosestWeek:", error)
    return null
  }
}

// Add a function to check if a date is within a week range
export function isDateInWeekRange(date: Date, weekRange: { start: Date; end: Date }): boolean {
  if (!isValid(date) || !isValid(weekRange.start) || !isValid(weekRange.end)) {
    console.warn("Invalid date or range provided to isDateInWeekRange:", { date, weekRange })
    return false
  }

  try {
    const timestamp = date.getTime()
    const isInRange = timestamp >= weekRange.start.getTime() && timestamp <= weekRange.end.getTime()

    logDateDebug(`Checking if date ${date.toISOString()} is in range:`, {
      start: weekRange.start.toISOString(),
      end: weekRange.end.toISOString(),
      result: isInRange,
    })

    return isInRange
  } catch (error) {
    console.error("Error in isDateInWeekRange:", error)
    return false
  }
}

// Add a function to check if a date is in the current week
export function isDateInCurrentWeek(date: Date): boolean {
  if (!isValid(date)) {
    console.warn("Invalid date provided to isDateInCurrentWeek:", date)
    return false
  }

  try {
    return isSameWeek(date, new Date(), { weekStartsOn: 1 })
  } catch (error) {
    console.error("Error in isDateInCurrentWeek:", error)
    return false
  }
}

// Add this function to ensure we can get the current week ID consistently
export function getCurrentWeekId(): string {
  try {
    const id = getWeekId(new Date())
    logDateDebug(`Current week ID: ${id}`)
    return id
  } catch (error) {
    console.error("Error in getCurrentWeekId:", error)
    // Return a fallback week ID for the specific current week
    const specificWeek = getSpecificCurrentWeek()
    return specificWeek.id
  }
}

// Define the WeekRange interface
export interface WeekRange {
  id: string
  startDate: Date
  endDate: Date
  label?: string
}

// Update the getSpecificCurrentWeek function to ensure it returns the correct week
export function getSpecificCurrentWeek(): { id: string; label: string; range: { start: Date; end: Date } } {
  try {
    // Create dates for March 24-30, 2025 (as per requirements)
    const startDate = new Date(2025, 2, 24) // Month is 0-indexed, so 2 = March
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(2025, 2, 30)
    endDate.setHours(23, 59, 59, 999)

    if (!isValid(startDate) || !isValid(endDate)) {
      throw new Error("Invalid specific week dates")
    }

    // Format the label using French locale
    const label = formatWeekRangeFrench({ start: startDate, end: endDate })

    // Generate the ID in the same format as other week IDs
    const id = `week-2025-3-24`

    return {
      id,
      label,
      range: { start: startDate, end: endDate },
    }
  } catch (error) {
    console.error("Error in getSpecificCurrentWeek:", error)

    // Create a fallback with hardcoded values
    return {
      id: "week-2025-3-24",
      label: "Semaine du 24/03/2025 au 30/03/2025",
      range: {
        start: new Date(2025, 2, 24, 0, 0, 0, 0),
        end: new Date(2025, 2, 30, 23, 59, 59, 999),
      },
    }
  }
}

// Helper function to check if two dates represent the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  if (!isValid(date1) || !isValid(date2)) {
    console.warn("Invalid dates provided to isSameDay:", { date1, date2 })
    return false
  }

  try {
    return isSameDayFns(date1, date2)
  } catch (error) {
    console.error("Error in isSameDay:", error)
    return false
  }
}

// Enhance the findCurrentWeek function to prioritize finding the specific week
export function findCurrentWeek(weekRanges: WeekRange[]): WeekRange | null {
  if (!weekRanges || weekRanges.length === 0) return null

  logDateDebug(`Finding current week in ${weekRanges.length} week ranges`)

  try {
    // First, try to find the specific week of March 24-30, 2025
    const specificWeek = getSpecificCurrentWeek()
    logDateDebug(`Specific week to find: ${specificWeek.id} (${specificWeek.label})`)

    // Try to find an exact match by ID first
    let matchingWeek = weekRanges.find((week) => week.id === specificWeek.id)
    if (matchingWeek) {
      logDateDebug(`Found specific week by ID: ${matchingWeek.id}`)
      return matchingWeek
    }

    // If not found by ID, try by date comparison
    matchingWeek = weekRanges.find(
      (week) =>
        isValid(week.startDate) &&
        isValid(week.endDate) &&
        isSameDay(week.startDate, specificWeek.range.start) &&
        isSameDay(week.endDate, specificWeek.range.end),
    )

    if (matchingWeek) {
      logDateDebug(`Found specific week by date comparison: ${matchingWeek.id}`)
      return matchingWeek
    }

    // If the specific week isn't found, fall back to the regular logic
    const today = new Date()
    const currentWeekId = getWeekId(today)
    logDateDebug(`Looking for current week with ID: ${currentWeekId}`)

    // Try to find an exact match by ID
    const exactMatch = weekRanges.find((week) => week.id === currentWeekId)
    if (exactMatch) {
      logDateDebug(`Found current week by ID: ${exactMatch.id}`)
      return exactMatch
    }

    // If no exact match, try to find a week that contains today
    const containingWeek = weekRanges.find(
      (week) =>
        isValid(week.startDate) &&
        isValid(week.endDate) &&
        isDateInWeekRange(today, {
          start: new Date(week.startDate),
          end: new Date(week.endDate),
        }),
    )

    if (containingWeek) {
      logDateDebug(`Found week containing today: ${containingWeek.id}`)
      return containingWeek
    }

    // If still not found, find the closest week by start date
    const closestWeek = findClosestWeek(weekRanges, today)
    if (closestWeek) {
      logDateDebug(`Using closest week: ${closestWeek.id}`)
    }
    return closestWeek
  } catch (error) {
    console.error("Error in findCurrentWeek:", error)
    return null
  }
}

// Add this new function to the date-utils.ts file
export function parseSharedPlanDateFormat(dateString: string): { start: Date; end: Date } | null {
  try {
    const [startStr, endStr] = dateString.split("--to--")

    // Convert from "DD-MM-YYYY" to Date objects
    const startParts = startStr.split("-").map(Number)
    const endParts = endStr.split("-").map(Number)

    if (startParts.length !== 3 || endParts.length !== 3) {
      return null
    }

    // Note: Month is 0-indexed in JavaScript Date
    const startDate = new Date(startParts[2], startParts[1] - 1, startParts[0])
    const endDate = new Date(endParts[2], endParts[1] - 1, endParts[0])

    // Validate dates
    if (!isValid(startDate) || !isValid(endDate)) {
      console.warn("Invalid dates from parseSharedPlanDateFormat:", { startDate, endDate })
      return null
    }

    return { start: startDate, end: endDate }
  } catch (error) {
    console.error("Error parsing shared plan date format:", error)
    return null
  }
}

// Add this new function to the date-utils.ts file
export function findClosestWeekRange(
  weekRanges: WeekRange[],
  targetStartDate: Date,
  targetEndDate: Date,
): WeekRange | null {
  if (!weekRanges || weekRanges.length === 0) return null
  if (!isValid(targetStartDate) || !isValid(targetEndDate)) {
    console.warn("Invalid target dates provided to findClosestWeekRange:", { targetStartDate, targetEndDate })
    return null
  }

  try {
    // First try to find an exact match
    let weekRange = weekRanges.find(
      (week) =>
        isValid(week.startDate) &&
        isValid(week.endDate) &&
        isSameDay(week.startDate, targetStartDate) &&
        isSameDay(week.endDate, targetEndDate),
    )

    if (weekRange) return weekRange

    // Then try to find a week that contains the target start date
    weekRange = weekRanges.find(
      (week) =>
        isValid(week.startDate) &&
        isValid(week.endDate) &&
        isDateInWeekRange(targetStartDate, { start: week.startDate, end: week.endDate }),
    )

    if (weekRange) return weekRange

    // If still not found, find the closest week by start date
    return (
      [...weekRanges]
        .filter((week) => isValid(week.startDate) && isValid(week.endDate))
        .sort((a, b) => {
          const distanceA = Math.abs(a.startDate.getTime() - targetStartDate.getTime())
          const distanceB = Math.abs(b.startDate.getTime() - targetStartDate.getTime())
          return distanceA - distanceB
        })[0] || null
    )
  } catch (error) {
    console.error("Error in findClosestWeekRange:", error)
    return null
  }
}

// Add a function to validate if a week range is valid
export function validateWeekRange(range: { start: Date; end: Date } | null): boolean {
  if (!range) return false

  try {
    const { start, end } = range

    // Check if dates are valid
    if (!(start instanceof Date) || !(end instanceof Date)) return false
    if (!isValid(start) || !isValid(end)) return false

    // Check if end date is after start date
    if (end.getTime() <= start.getTime()) return false

    // Check if the range is approximately 7 days (allowing for DST changes)
    const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff < 6 || daysDiff > 7) return false

    return true
  } catch (error) {
    console.error("Error in validateWeekRange:", error)
    return false
  }
}

// Add a function to debug week data
export function debugWeekData(weekId: string, weekLabel: string, weekRange: { start: Date; end: Date } | null): void {
  if (DEBUG_DATES) {
    console.log("[WEEK-DEBUG] Selected week data:", {
      id: weekId,
      label: weekLabel,
      range: weekRange
        ? {
            start: weekRange.start.toISOString(),
            end: weekRange.end.toISOString(),
            valid: validateWeekRange(weekRange),
          }
        : "null",
    })
  }
}

export function generateWeekId(date: Date): string {
  if (!isValid(date)) {
    console.warn("Invalid date provided to generateWeekId:", date)
    // Return a fallback week ID for the specific current week
    const specificWeek = getSpecificCurrentWeek()
    return specificWeek.id
  }

  try {
    return `week-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  } catch (error) {
    console.error("Error in generateWeekId:", error)
    // Return a fallback week ID for the specific current week
    const specificWeek = getSpecificCurrentWeek()
    return specificWeek.id
  }
}

// Get the start and end dates of a week based on the week ID
export function getWeekRange(weekId: string): { startDate: Date; endDate: Date } {
  // Parse the week ID to get the start date
  // Assuming weekId format is 'week-YYYY-M-D' or 'YYYY-MM-DD'
  const dateString = weekId.replace('week-', '')
  const [year, month, day] = dateString.split("-").map(Number)

  // Create the start date (Monday)
  const startDate = new Date(year, month - 1, day)

  // Create the end date (Sunday)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)

  return { startDate, endDate }
}
