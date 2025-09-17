import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/progress-bar"
import type { TeamMember } from "@/types"
import Image from "next/image"

interface TeamProgressProps {
  teamMembers: TeamMember[]
  memberStats: Record<string, { complete: number; total: number }>
}

export function TeamProgress({ teamMembers, memberStats }: TeamProgressProps) {
  // Sort team members by completion percentage (high to low)
  const sortedMembers = [...teamMembers].sort((a, b) => {
    const statsA = memberStats[a.id] || { complete: 0, total: 0 }
    const statsB = memberStats[b.id] || { complete: 0, total: 0 }

    const progressA = statsA.total > 0 ? (statsA.complete / statsA.total) * 100 : 0
    const progressB = statsB.total > 0 ? (statsB.complete / statsB.total) * 100 : 0

    return progressB - progressA
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Team Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedMembers.map((member) => {
          const stats = memberStats[member.id] || { complete: 0, total: 0 }
          const progress = stats.total > 0 ? (stats.complete / stats.total) * 100 : 0

          return (
            <div key={member.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl || "/placeholder.svg"}
                      alt={member.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium">{member.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {stats.complete}/{stats.total} tasks
                </span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          )
        })}

        {teamMembers.length === 0 && (
          <div className="py-6 text-center text-muted-foreground">No team members available</div>
        )}
      </CardContent>
    </Card>
  )
}
