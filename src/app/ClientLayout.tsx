"use client"

import type React from "react"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { ErrorBoundary } from "@/components/layout/error-boundary"
import { useEffect } from "react"
import { verifyAndCorrectWeekRanges, ensureSpecificWeekExists } from "@/services/firebase-service"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ensure the specific week exists
        await ensureSpecificWeekExists()

        // Verify and correct week ranges
        await verifyAndCorrectWeekRanges()
      } catch (error) {
        console.error("Error initializing app:", error)
      }
    }

    initializeApp()
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider delayDuration={300} skipDelayDuration={0}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  )
}
