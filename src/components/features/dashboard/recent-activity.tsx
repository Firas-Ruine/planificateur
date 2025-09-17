import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import type { Objective } from "@/types"

interface RecentActivityProps {
  objectives: Objective[]
  weekRange: { start: Date; end: Date }
}

export function RecentActivity({ objectives, weekRange }: RecentActivityProps) {
  // Get all tasks from all objectives
  const allTasks = objectives.flatMap((obj) =>
    obj.tasks.map((task) => ({
      ...task,
      objectiveTitle: obj.title,
    })),
  )

  // Sort tasks by updatedAt (if available) or createdAt
  const sortedTasks = allTasks.sort((a, b) => {
    const aDate = a.updatedAt ? new Date(a.updatedAt.seconds * 1000) : new Date(a.createdAt.seconds * 1000)
    const bDate = b.updatedAt ? new Date(b.updatedAt.seconds * 1000) : new Date(b.createdAt.seconds * 1000)
    return bDate.getTime() - aDate.getTime()
  })

  // Take only the 5 most recent tasks
  const recentTasks = sortedTasks.slice(0, 5)

  return (
    <div className="space-y-4">
      {recentTasks.length === 0 ? (
        <p className="text-muted-foreground">No recent activity for this week.</p>
      ) : (
        recentTasks.map((task) => {
          const date = task.updatedAt
            ? new Date(task.updatedAt.seconds * 1000)
            : new Date(task.createdAt.seconds * 1000)

          return (
            <div key={task.id} className="flex items-start space-x-3">
              <div className={`mt-0.5 h-2 w-2 rounded-full ${task.completed ? "bg-green-500" : "bg-amber-500"}`} />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.completed ? "Completed" : "In progress"} •{" "}
                  {formatDistanceToNow(date, { addSuffix: true, locale: fr })}
                </p>
                <p className="text-xs text-muted-foreground">From: {task.objectiveTitle}</p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
