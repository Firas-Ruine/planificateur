import { getObjectiveById, getTasksForObjective } from "@/services/firebase-service"
import { ObjectiveDetail } from "@/components/objectives/objective-detail"
import { notFound } from "next/navigation"

interface ObjectiveDetailPageProps {
  params: {
    id: string
  }
}

export default async function ObjectiveDetailPage({ params }: ObjectiveDetailPageProps) {
  try {
    const objective = await getObjectiveById(params.id)

    if (!objective) {
      notFound()
    }

    // Get tasks for this specific objective
    const tasks = await getTasksForObjective(params.id)
    objective.tasks = tasks

    return (
      <div className="container mx-auto py-6">
        <ObjectiveDetail objective={objective} />
      </div>
    )
  } catch (error) {
    console.error("Error loading objective:", error)
    notFound()
  }
}
