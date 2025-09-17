import { ClipboardList, FileQuestion, Users } from "lucide-react"

interface EmptyStateProps {
  type: "objectives" | "tasks" | "filtered"
  filtered?: boolean
}

export function EmptyState({ type, filtered = false }: EmptyStateProps) {
  let icon = ClipboardList
  let title = "Aucun contenu"
  let description = "Aucun contenu disponible."

  if (type === "objectives") {
    icon = ClipboardList
    title = "Aucun objectif"
    description = filtered
      ? "Aucun objectif ne correspond aux filtres sélectionnés."
      : "Commencez par créer un objectif pour cette semaine."
  } else if (type === "tasks") {
    icon = FileQuestion
    title = "Aucune tâche"
    description = filtered
      ? "Aucune tâche ne correspond aux filtres sélectionnés."
      : "Cet objectif n'a pas encore de tâches associées."
  } else if (type === "filtered") {
    icon = Users
    title = "Aucun résultat"
    description = "Aucune donnée ne correspond aux membres sélectionnés."
  }

  const Icon = icon

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 text-center max-w-sm">{description}</p>
    </div>
  )
}
