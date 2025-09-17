import { NextResponse } from "next/server"
import { initializeDefaultData } from "@/services/firebase-service"

export async function POST() {
  try {
    await initializeDefaultData()
    return NextResponse.json({ message: "Firebase data initialized successfully" })
  } catch (error) {
    console.error("Error initializing Firebase data:", error)

    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isPermissionError = errorMessage.includes("permission") || errorMessage.includes("unauthorized")

    return NextResponse.json(
      {
        message: "Error initializing Firebase data",
        error: errorMessage,
        type: isPermissionError ? "permission" : "unknown",
        helpText: isPermissionError
          ? "You need to update your Firebase security rules to allow write access."
          : "Check your Firebase configuration and connection.",
      },
      { status: 500 },
    )
  }
}
