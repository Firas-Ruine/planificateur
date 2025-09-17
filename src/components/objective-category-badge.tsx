import { Badge } from "@/components/ui/badge"
import type { ObjectiveCategory } from "@/types"

interface ObjectiveCategoryBadgeProps {
  category: ObjectiveCategory
  className?: string
}

export function ObjectiveCategoryBadge({ category, className = "" }: ObjectiveCategoryBadgeProps) {
  switch (category) {
    case "urgent-important":
      return <Badge className={`bg-red-500 text-white ${className}`}>Urgent & Important</Badge>
    case "important-not-urgent":
      return <Badge className={`bg-blue-500 text-white ${className}`}>Important & Non Urgent</Badge>
    case "urgent-not-important":
      return <Badge className={`bg-orange-500 text-white ${className}`}>Urgent & Non Important</Badge>
    case "not-urgent-not-important":
      return <Badge className={`bg-gray-500 text-white ${className}`}>Standard</Badge>
    default:
      return <Badge className={`bg-gray-500 text-white ${className}`}>Non catégorisé</Badge>
  }
}
