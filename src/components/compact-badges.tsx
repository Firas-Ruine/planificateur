import { ComplexityBadge } from "./complexity-badge"
import { CriticalityBadge } from "./criticality-badge"
import { cn } from "@/lib/utils"

interface CompactBadgesProps {
  complexity?: "low" | "medium" | "high" | "critical"
  criticality?: "low" | "medium" | "high" | "critical"
  className?: string
}

export function CompactBadges({ complexity, criticality, className }: CompactBadgesProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {complexity && (
        <ComplexityBadge 
          complexity={complexity} 
          className="text-xs py-0.5 px-1.5" 
        />
      )}
      {criticality && (
        <CriticalityBadge 
          criticality={criticality} 
          className="text-xs py-0.5 px-1.5" 
        />
      )}
    </div>
  )
}