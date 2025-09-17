"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function UpdateMembersS3Page() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const updateMembers = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/update-members-s3", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: "Members updated successfully with S3 URLs!" })
      } else {
        setResult({ success: false, message: `Error: ${data.message}` })
      }
    } catch (error) {
      console.error("Update error:", error)
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Update Members with S3 URLs</h1>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Update Members List</CardTitle>
          <CardDescription>
            This will update the members list in the Firebase database with S3 image URLs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">The update will replace the existing members' avatar URLs with direct S3 links.</p>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Button onClick={updateMembers} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Members with S3 URLs"
            )}
          </Button>

          {result && (
            <div
              className={`p-3 rounded w-full ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {result.success ? (
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {result.message}
                </div>
              ) : (
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {result.message}
                </div>
              )}
            </div>
          )}
        </CardFooter>
      </Card>

      <div className="mt-8 text-center">
        <a href="/" className="text-blue-600 hover:underline">
          Back to Home
        </a>
      </div>
    </div>
  )
}
