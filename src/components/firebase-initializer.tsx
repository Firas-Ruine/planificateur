"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function FirebaseInitializer() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const initializeFirebase = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/init-firebase", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: "Firebase data initialized successfully!" })
      } else {
        // More detailed error message
        let errorMessage = `Error: ${data.message}`

        if (data.message?.includes("permission")) {
          errorMessage += " Please check your Firebase security rules in the Firebase Console."
        }

        setResult({ success: false, message: errorMessage })
      }
    } catch (error) {
      console.error("Initialization error:", error)
      let errorMessage = `Error: ${error instanceof Error ? error.message : "Unknown error"}`

      // Add helpful context based on error type
      if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        errorMessage += " Please check your internet connection."
      }

      setResult({
        success: false,
        message: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Firebase Database Initializer</h2>
      <p className="mb-4 text-gray-600">
        If your Firebase database is empty, use this button to initialize it with default data.
      </p>

      <Button onClick={initializeFirebase} disabled={loading} className="mb-4">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initializing...
          </>
        ) : (
          "Initialize Firebase Data"
        )}
      </Button>

      {result && (
        <div className={`p-3 rounded ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {result.message}
        </div>
      )}
    </div>
  )
}
