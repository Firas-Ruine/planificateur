import { type NextRequest, NextResponse } from "next/server"
import { getObjectives } from "@/services/firebase-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get("productId")
    const weekId = searchParams.get("weekId")

    if (!productId || !weekId) {
      return NextResponse.json({ error: "Missing required parameters: productId and weekId" }, { status: 400 })
    }

    // Fetch objectives using the same function as the plans component
    const objectives = await getObjectives(productId, weekId)

    return NextResponse.json({ objectives })
  } catch (error) {
    console.error("Error fetching objectives:", error)
    return NextResponse.json({ error: "Failed to fetch objectives" }, { status: 500 })
  }
}
