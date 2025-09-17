import { format, startOfWeek, endOfWeek } from "date-fns"

export function cn(...inputs: any) {
  return inputs.filter(Boolean).join(" ")
}

// Add formatDate function
export function formatDate(date: Date, formatString = "dd/MM/yyyy"): string {
  return format(date, formatString)
}

// Add getWeekRange function
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Week starts on Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }) // Week ends on Sunday
  return { start, end }
}

// Add getWeekId function
export function getWeekId(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  return `week-${format(weekStart, "yyyy-M-d")}`
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
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null
    }

    return { start: startDate, end: endDate }
  } catch (error) {
    console.error("Error parsing shared plan date format:", error)
    return null
  }
}

// Add this new function to the date-utils.ts file
export function findClosestWeekRange(weekRanges: any[], targetStartDate: Date, targetEndDate: Date): any | null {
  if (!weekRanges || weekRanges.length === 0) return null

  // First try to find an exact match
  let weekRange = weekRanges.find(
    (week) => isSameDay(week.startDate, targetStartDate) && isSameDay(week.endDate, targetEndDate),
  )

  if (weekRange) return weekRange

  // Then try to find a week that contains the target start date
  weekRange = weekRanges.find((week) =>
    isDateInWeekRange(targetStartDate, { start: week.startDate, end: week.endDate }),
  )

  if (weekRange) return weekRange

  // If still not found, find the closest week by start date
  return [...weekRanges].sort((a, b) => {
    const distanceA = Math.abs(a.startDate.getTime() - targetStartDate.getTime())
    const distanceB = Math.abs(b.startDate.getTime() - targetStartDate.getTime())
    return distanceA - distanceB
  })[0]
}

// Helper function to check if two dates represent the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Add a function to check if a date is within a week range
function isDateInWeekRange(date: Date, weekRange: { start: Date; end: Date }): boolean {
  const timestamp = date.getTime()
  return timestamp >= weekRange.start.getTime() && timestamp <= weekRange.end.getTime()
}
