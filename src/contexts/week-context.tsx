"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { getCurrentWeekRange, generateWeekId } from "@/lib/date-utils"

interface WeekContextType {
  startDate: Date
  endDate: Date
  weekId: string
  setWeekRange: (start: Date, end: Date, id: string) => void
}

const WeekContext = createContext<WeekContextType | undefined>(undefined)

export function WeekProvider({ children }: { children: ReactNode }) {
  // Initialize with the current week
  const currentWeek = getCurrentWeekRange()
  const [startDate, setStartDate] = useState<Date>(currentWeek.start)
  const [endDate, setEndDate] = useState<Date>(currentWeek.end)
  const [weekId, setWeekId] = useState<string>(generateWeekId(currentWeek.start))

  const setWeekRange = (start: Date, end: Date, id: string) => {
    setStartDate(start)
    setEndDate(end)
    setWeekId(id)
  }

  // Log the current week context when it changes
  useEffect(() => {
    console.log("Week context updated:", {
      weekId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
  }, [startDate, endDate, weekId])

  return <WeekContext.Provider value={{ startDate, endDate, weekId, setWeekRange }}>{children}</WeekContext.Provider>
}

export function useWeek() {
  const context = useContext(WeekContext)
  if (context === undefined) {
    throw new Error("useWeek must be used within a WeekProvider")
  }
  return context
}
