import type { Timestamp } from "firebase/firestore"

export type ViewType = "objectifs" | "dashboard" | "plans"

export interface Product {
  id: string
  name: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Member {
  id: string
  name: string
  role: string
  avatar: string
  initials: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface ComplexityLevel {
  id: string
  name: string
  color: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface CriticalityLevel {
  id: string
  name: string
  color: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface WeekRange {
  id: string
  startDate: Date
  endDate: Date
  label: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Task {
  id: string
  objectiveId: string
  title: string
  assignee: string | null
  complexity: string
  criticality: string
  completed: boolean
  position: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type ObjectiveCategory =
  | "urgent-important"
  | "important-not-urgent"
  | "urgent-not-important"
  | "not-urgent-not-important"

export interface Flag {
  isFlagged: boolean
  description: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Objective {
  id: string
  productId: string
  weekId: string
  title: string
  tasks: Task[]
  progress: number
  position: number
  isUrgent?: boolean
  isImportant?: boolean
  category?: ObjectiveCategory
  complexity?: string
  criticality?: string
  assignees?: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
  targetCompletionDate?: Date | null
  flag?: Flag // Add flag information
}

export interface Stats {
  totalObjectives: number
  totalTasks: number
  completedTasks: number
  globalProgress: number
  memberStats: Record<string, { total: number; completed: number }>
}

export interface TeamMember {
  id: string
  name: string
  role: string
  avatarUrl: string
  initials: string
}

export interface Plan {
  assigneeId: string
  tasks: (Task & { objectiveTitle: string; objectiveId: string })[]
  completedTasks: number
  totalTasks: number
  progress: number
}
