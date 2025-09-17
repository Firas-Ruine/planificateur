"use client"

import { useState, useEffect, useRef } from "react"
import { getObjectives, getPlans, getMembers } from "@/services/firebase-service"
import type { Plan, Objective, Member } from "@/types"
import { formatDate, getWeekRange } from "@/lib/date-utils"
import { generatePDF } from "@/utils/pdf-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { WeekDataValidator } from "@/components/week-data-validator"
import { useToast } from "@/components/ui/use-toast"

interface SharedPlanPageProps {
  params: {
    weekId: string
  }
}

export default function SharedPlanPage({ params }: SharedPlanPageProps) {
  const { weekId } = params
  const [plans, setPlans] = useState<Plan[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching shared plan data for weekId:", weekId)

        const [plansData, objectivesData, membersData] = await Promise.all([
          getPlans(weekId),
          getObjectives(weekId),
          getMembers(),
        ])

        console.log("Fetched plans:", plansData)
        console.log("Fetched objectives:", objectivesData)
        console.log("Fetched members:", membersData)

        setPlans(plansData)
        setObjectives(objectivesData)
        setMembers(membersData)
      } catch (err) {
        console.error("Error fetching shared plan data:", err)
        setError("Failed to load data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (weekId) {
      fetchData()
    }
  }, [weekId])

  // Create a separate PDF-optimized view
  const renderPDFContent = () => {
    const { startDate, endDate } = getWeekRange(weekId)
    const formattedDateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`

    return (
      <div className="pdf-content p-6 bg-white" style={{ width: "100%", maxWidth: "800px" }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Weekly Plan</h1>
          <p>{formattedDateRange}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Team Objectives</h2>
          {objectives.length > 0 ? (
            <ul className="space-y-2">
              {objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="min-w-4 h-4 rounded-full bg-primary mt-1" />
                  <span>{objective.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No objectives for this week.</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Team Plans</h2>
          {plans.length > 0 ? (
            <div className="space-y-6">
              {members.map((member) => {
                const memberPlans = plans.filter((plan) => plan.memberId === member.id)

                return (
                  <div key={member.id} className="space-y-2">
                    <h3 className="font-medium text-lg">{member.name}</h3>
                    {memberPlans.length > 0 ? (
                      <ul className="space-y-1 pl-5 list-disc">
                        {memberPlans.map((plan, index) => (
                          <li key={index}>{plan.text}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground pl-5">No plans for this week.</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No plans for this week.</p>
          )}
        </div>
      </div>
    )
  }

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your PDF...",
      })

      // Create a temporary div for PDF content
      const tempDiv = document.createElement("div")
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      tempDiv.style.top = "-9999px"
      tempDiv.style.width = "800px" // Fixed width for better layout control
      document.body.appendChild(tempDiv)

      // Render the PDF content into the temporary div
      const { render, unmountComponentAtNode } = await import("react-dom")
      render(renderPDFContent(), tempDiv)

      // Wait for images and fonts to load
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Generate PDF
      await generatePDF(tempDiv, `weekly-plan-${weekId}.pdf`, {
        scale: 2,
        quality: 1,
        pageFormat: "a4",
        orientation: "portrait",
      })

      // Clean up
      unmountComponentAtNode(tempDiv)
      document.body.removeChild(tempDiv)

      toast({
        title: "PDF Downloaded",
        description: "Your weekly plan has been downloaded as a PDF.",
      })
    } catch (err) {
      console.error("Error generating PDF:", err)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const { startDate, endDate } = getWeekRange(weekId)
  const formattedDateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 p-4 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weekly Plan</h1>
          <p className="text-muted-foreground">{formattedDateRange}</p>
        </div>
        <Button variant="outline" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </div>

      <WeekDataValidator weekId={weekId} objectives={objectives} />

      <div ref={contentRef} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Team Objectives</h2>
            {objectives.length > 0 ? (
              <ul className="space-y-2">
                {objectives.map((objective) => (
                  <li key={objective.id} className="flex items-start gap-2">
                    <div className="min-w-4 h-4 rounded-full bg-primary mt-1" />
                    <span>{objective.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No objectives for this week.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Team Plans</h2>
            {plans.length > 0 ? (
              <div className="space-y-4">
                {members.map((member) => {
                  const memberPlans = plans.filter((plan) => plan.memberId === member.id)

                  return (
                    <div key={member.id} className="space-y-2">
                      <h3 className="font-medium">{member.name}</h3>
                      {memberPlans.length > 0 ? (
                        <ul className="space-y-1 pl-5 list-disc">
                          {memberPlans.map((plan) => (
                            <li key={plan.id}>{plan.text}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground pl-5">No plans for this week.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No plans for this week.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden div for PDF content - will not be visible on the page */}
      <div style={{ display: "none" }}>
        <div id="pdf-content"></div>
      </div>
    </div>
  )
}
