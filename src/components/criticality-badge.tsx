interface CriticalityBadgeProps {
  criticality: "low" | "medium" | "high" | "critical"
  className?: string
}

export function CriticalityBadge({ criticality, className = "" }: CriticalityBadgeProps) {
  const getLabel = () => {
    switch (criticality) {
      case "low":
        return "Basse"
      case "medium":
        return "Moyenne"
      case "high":
        return "Haute"
      case "critical":
        return "Critique"
      default:
        return "Moyenne"
    }
  }

  const getColorClasses = () => {
    switch (criticality) {
      case "low":
        return "bg-green-100 text-green-800 print:badge-criticality-low"
      case "medium":
        return "bg-yellow-100 text-yellow-800 print:badge-criticality-medium"
      case "high":
        return "bg-red-100 text-red-800 print:badge-criticality-high"
      case "critical":
        return "bg-purple-100 text-purple-800 print:badge-criticality-critical"
      default:
        return "bg-yellow-100 text-yellow-800 print:badge-criticality-medium"
    }
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${getColorClasses()} ${className} print:badge`}>
      Criticité: {getLabel()}
    </span>
  )
}
