"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, AlertCircle, CheckCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FirebaseStatusProps {
  onUseFallback: () => void
}

export function FirebaseStatus({ onUseFallback }: FirebaseStatusProps) {
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"rules" | "config">("rules")

  useEffect(() => {
    checkFirebaseConnection()
  }, [])

  const checkFirebaseConnection = async () => {
    try {
      setStatus("loading")
      // Try to read from Firestore
      await getDocs(collection(db, "products"))
      setStatus("success")
    } catch (error) {
      console.error("Firebase connection error:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
    }
  }

  return (
    <div className="mb-6">
      {status === "loading" && (
        <div className="flex items-center p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          <Loader2 className="animate-spin mr-2 h-5 w-5" />
          <span>Testing Firebase connection...</span>
        </div>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Firebase Connection Error</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{errorMessage}</p>

            <div className="mt-4 bg-white rounded border p-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "rules" | "config")}>
                <TabsList className="mb-4">
                  <TabsTrigger value="rules">Security Rules</TabsTrigger>
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                </TabsList>

                <TabsContent value="rules">
                  <h4 className="font-bold mb-2">How to fix Firebase permissions:</h4>
                  <ol className="list-decimal pl-5 space-y-2 mb-4">
                    <li>
                      Go to the{" "}
                      <a
                        href="https://console.firebase.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Firebase Console
                      </a>
                    </li>
                    <li>
                      Select your project: <strong>{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</strong>
                    </li>
                    <li>In the left sidebar, click on "Firestore Database"</li>
                    <li>Go to the "Rules" tab</li>
                    <li>Update your rules to allow read/write access during development:</li>
                    <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                      {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Allow read/write access for development
      allow read, write: if true;
      
      // For production, use more restrictive rules
      // allow read, write: if request.auth != null;
    }
  }
}`}
                    </pre>
                    <li>Click "Publish" to save the rules</li>
                    <li>Return to this page and refresh</li>
                  </ol>
                </TabsContent>

                <TabsContent value="config">
                  <h4 className="font-bold mb-2">Check your Firebase configuration:</h4>
                  <ol className="list-decimal pl-5 space-y-2 mb-4">
                    <li>
                      Verify that your Firebase project ID is correct:{" "}
                      <strong>{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</strong>
                    </li>
                    <li>Make sure Firestore Database is enabled in your Firebase project</li>
                    <li>
                      Check that all environment variables are set correctly in your <code>.env.local</code> file
                    </li>
                    <li>Ensure your Firebase API key is valid</li>
                  </ol>
                </TabsContent>
              </Tabs>

              <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200 flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-700">Continue with mock data</p>
                  <p className="text-sm text-blue-600 mb-2">
                    You can continue using the application with mock data while you fix the Firebase connection.
                  </p>
                  <Button onClick={onUseFallback} variant="outline" size="sm" className="bg-white">
                    Use Mock Data
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={checkFirebaseConnection}>
                Retry Connection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status === "success" && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Firebase Connected</AlertTitle>
          <AlertDescription>
            Successfully connected to Firebase project: <strong>{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</strong>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
