import Link from "next/link"
import type { Objective, TeamMember, ObjectiveCategory } from "@/types"
import { ObjectiveCard } from "@/components/features/objectives/objective-card"
import { EmptyState } from "@/components/empty-state"

interface WeeklyObjectivesProps {
  objectives: Objective[]
  teamMembers: TeamMember[]
  productId: string
  weekId: string
}

// Helper function to determine category if not explicitly set
const getObjectiveCategory = (objective: Objective): ObjectiveCategory => {
  if (objective.category) return objective.category as ObjectiveCategory

  if (objective.isUrgent && objective.isImportant) return "urgent-important"
  if (objective.isImportant) return "important-not-urgent"
  if (objective.isUrgent) return "urgent-not-important"
  return "not-urgent-not-important"
}

// Helper function to get category display name and color
const getCategoryInfo = (category: ObjectiveCategory): { name: string; colorClass: string } => {
  switch (category) {
    case "urgent-important":
      return { name: "Urgent & Important", colorClass: "bg-red-100 text-red-800 border-red-200" }
    case "important-not-urgent":
      return { name: "Important (Non Urgent)", colorClass: "bg-blue-100 text-blue-800 border-blue-200" }
    case "urgent-not-important":
      return { name: "Urgent (Non Important)", colorClass: "bg-orange-100 text-orange-800 border-orange-200" }
    case "not-urgent-not-important":
      return { name: "Standard", colorClass: "bg-gray-100 text-gray-800 border-gray-200" }
    default:
      return { name: "Non catégorisé", colorClass: "bg-gray-100 text-gray-800 border-gray-200" }
  }
}

export function WeeklyObjectives({ objectives, teamMembers, productId, weekId }: WeeklyObjectivesProps) {
  if (objectives.length === 0) {
    return (
      <EmptyState
        title="Aucun objectif"
        description="Il n'y a pas d'objectifs pour cette semaine."
        action={
          <Link
            href="/planning"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Créer un objectif
          </Link>
        }
      />
    )
  }

  // Group objectives by category
  const objectivesByCategory: Record<ObjectiveCategory, Objective[]> = {
    "urgent-important": [],
    "important-not-urgent": [],
    "urgent-not-important": [],
    "not-urgent-not-important": [],
  }

  // Sort objectives into categories
  objectives.forEach((objective) => {
    const category = getObjectiveCategory(objective)
    objectivesByCategory[category].push(objective)
  })

  // Define the display order of categories
  const categoryOrder: ObjectiveCategory[] = [
    "urgent-important",
    "important-not-urgent",
    "urgent-not-important",
    "not-urgent-not-important",
  ]

  return (
    <div className="space-y-6">
      {categoryOrder.map((category) => {
        const { name, colorClass } = getCategoryInfo(category)
        const categoryObjectives = objectivesByCategory[category]

        // Skip empty categories
        if (categoryObjectives.length === 0) return null

        return (
          <div key={category} className="space-y-3">
            <div className={`px-3 py-1.5 rounded-md inline-block ${colorClass} border`}>
              <h3 className="font-medium text-sm">
                {name} ({categoryObjectives.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {categoryObjectives.map((objective) => (
                <ObjectiveCard key={objective.id} objective={objective} teamMembers={teamMembers} />
              ))}
            </div>
          </div>
        )
      })}

      <div className="mt-4 text-center">
        <Link
          href={`/objectives/${productId}/${weekId}`}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Voir tous les objectifs
        </Link>
      </div>
    </div>
  )
}
