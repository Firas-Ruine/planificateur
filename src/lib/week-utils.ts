"use client"

import { format, startOfWeek, endOfWeek } from "date-fns"
import { fr } from "date-fns/locale"

export function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
}

export function getWeekRange(date: Date): { startDate: Date; endDate: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Week starts on Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }) // Week ends on Sunday
  return { startDate: start, endDate: end }
}

export function getWeekId(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  return `week-${format(weekStart, "yyyy-M-d")}`
}

export function formatWeekRangeFrench({ start, end }: { start: Date; end: Date }): string {
  return `Semaine du ${format(start, "dd/MM/yyyy", { locale: fr })} au ${format(end, "dd/MM/yyyy", { locale: fr })}`
}

export function getCurrentWeekId(): string {
  return getWeekId(new Date())
}
