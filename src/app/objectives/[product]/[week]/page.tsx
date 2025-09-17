import { Suspense } from "react"
import { getProducts } from "@/services/firebase-service"
import { ObjectiveList } from "@/components/objectives/objective-list"
import { ObjectiveListSkeleton } from "@/components/objectives/objective-list-skeleton"
import { getWeekId, getWeekOptions } from "@/lib/date-utils"
import { notFound } from "next/navigation"

interface ObjectivesPageProps {
  params: {
    product: string
    week: string
  }
}

export async function generateStaticParams() {
  try {
    const products = await getProducts()
    const weeks = getWeekOptions()

    const params = []
    for (const product of products) {
      for (const week of weeks) {
        params.push({
          product: product.id,
          week: week.id,
        })
      }
    }

    return params
  } catch (error) {
    console.error("Error generating static params:", error)
    return []
  }
}

export default async function ObjectivesPage({ params }: ObjectivesPageProps) {
  try {
    // Get all products to validate the product ID
    const products = await getProducts()
    const product = products.find((p) => p.id === params.product)

    if (!product) {
      notFound()
    }

    // Determine the week ID
    let weekId = params.week

    // Handle "current-week" special case
    if (params.week === "current-week") {
      weekId = getWeekId(new Date())
    }

    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Objectives for {product.name}</h1>
        <Suspense fallback={<ObjectiveListSkeleton />}>
          <ObjectiveList productId={params.product} weekId={weekId} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("Error rendering objectives page:", error)
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Error Loading Objectives</h1>
        <p>An error occurred while loading the objectives. Please try again later.</p>
      </div>
    )
  }
}
