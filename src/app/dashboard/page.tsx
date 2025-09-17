import { Suspense } from "react"
import { getProducts } from "@/services/firebase-service"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { getCurrentWeekRange, getWeekId } from "@/lib/date-utils"

export default async function DashboardPage() {
  // Get all products
  const products = await getProducts()

  // Get the current week ID
  const currentWeekRange = getCurrentWeekRange()
  const currentWeekId = getWeekId(new Date())

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent products={products} weekId={currentWeekId} weekRange={currentWeekRange} />
      </Suspense>
    </div>
  )
}
