"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2 } from "lucide-react"

export default function TestPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collections, setCollections] = useState<string[]>([])
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  useEffect(() => {
    // Check environment variables
    const vars = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5) + "...",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.substring(0, 10) + "...",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.substring(0, 10) + "...",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.substring(0, 5) + "...",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 5) + "...",
    }

    setEnvVars(vars)

    // Test Firestore connection
    const testFirestore = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to list collections
        const collectionsSnapshot = await getDocs(collection(db, "products"))
        console.log("Firestore query successful:", collectionsSnapshot)

        setCollections(["products", "members", "objectives", "tasks", "weekRanges"])
        setLoading(false)
      } catch (err) {
        console.error("Firestore test error:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
        setLoading(false)
      }
    }

    testFirestore()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firebase Connection Test</h1>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{JSON.stringify(envVars, null, 2)}</pre>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Firestore Connection</h2>
        {loading ? (
          <div className="flex items-center text-blue-600">
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
            Testing connection...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <p className="font-semibold">Error connecting to Firestore:</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <p className="font-semibold">Successfully connected to Firestore!</p>
          </div>
        )}
      </div>

      {!loading && !error && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Expected Collections</h2>
          <ul className="list-disc pl-5 space-y-1">
            {collections.map((collection) => (
              <li key={collection}>{collection}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <a href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
          Back to Home
        </a>
      </div>
    </div>
  )
}
