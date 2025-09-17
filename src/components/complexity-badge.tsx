interface ComplexityBadgeProps {
  complexity: "low" | "medium" | "high" | "critical"
  className?: string
}

export function ComplexityBadge({ complexity, className = "" }: ComplexityBadgeProps) {
  const getLabel = () => {
    switch (complexity) {
      case "low":
        return "Facile"
      case "medium":
        return "Moyenne"
      case "high":
        return "Élevée"
      case "critical":
        return "Critique"
      default:
        return "Moyenne"
    }
  }

  const getColorClasses = () => {
    switch (complexity) {
      case "low":
        return "bg-green-100 text-green-800 print:badge-complexity-low"
      case "medium":
        return "bg-blue-100 text-blue-800 print:badge-complexity-medium"
      case "high":
        return "bg-orange-100 text-orange-800 print:badge-complexity-high"
      case "critical":
        return "bg-red-100 text-red-800 print:badge-complexity-critical"
      default:
        return "bg-blue-100 text-blue-800 print:badge-complexity-medium"
    }
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${getColorClasses()} ${className} print:badge`}>
      Complexité: {getLabel()}
    </span>
  )
}
