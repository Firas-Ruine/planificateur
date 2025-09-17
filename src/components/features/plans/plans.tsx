"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getObjectives, getPlans, getMembers, getTeamMembers } from "@/services/firebase-service"
import type { Plan, Objective, Member, TeamMember } from "@/types"
import { formatDate, getWeekRange, getWeekId } from "@/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { WeekDataValidator } from "@/components/week-data-validator"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface PlansProps {
  weekId?: string
}

export default function Plans({ weekId }: PlansProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWeekId, setCurrentWeekId] = useState<string>(weekId || getWeekId(new Date()))
  const [activeTab, setActiveTab] = useState<string>("all")
  const { toast } = useToast()
  const router = useRouter()
  const plansRef = useRef<HTMLDivElement>(null)
  const pdfContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching data for weekId:", currentWeekId)

        const [plansData, objectivesData, membersData, teamMembersData] = await Promise.all([
          getPlans(currentWeekId),
          getObjectives(currentWeekId),
          getMembers(),
          getTeamMembers(),
        ])

        console.log("Fetched plans:", plansData)
        console.log("Fetched objectives:", objectivesData)
        console.log("Fetched members:", membersData)
        console.log("Fetched team members:", teamMembersData)

        setPlans(plansData)
        setObjectives(objectivesData)
        setMembers(membersData)
        setTeamMembers(teamMembersData)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to load data. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentWeekId, toast])

  const handleShareClick = () => {
    const shareUrl = `${window.location.origin}/shared-plan/${currentWeekId}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link Copied!",
      description: "Share link has been copied to clipboard.",
    })
  }

  // Create a separate PDF-optimized view
  const renderPDFContent = () => {
    const { startDate, endDate } = getWeekRange(currentWeekId)
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
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      // Clean up
      unmountComponentAtNode(tempDiv)
      document.body.removeChild(tempDiv)

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      // First page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`weekly-plan-${currentWeekId}.pdf`)

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

  const { startDate, endDate } = getWeekRange(currentWeekId)
  const formattedDateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weekly Plan</h1>
          <p className="text-muted-foreground">{formattedDateRange}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShareClick}>
            Share
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            Download PDF
          </Button>
        </div>
      </div>

      <WeekDataValidator weekId={currentWeekId} objectives={objectives} />

      <div ref={plansRef} className="space-y-6">
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
              <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {members.map((member) => (
                    <TabsTrigger key={member.id} value={member.id}>
                      {member.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all">
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
                </TabsContent>

                {members.map((member) => {
                  const memberPlans = plans.filter((plan) => plan.memberId === member.id)

                  return (
                    <TabsContent key={member.id} value={member.id}>
                      <div className="space-y-2">
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
                    </TabsContent>
                  )
                })}
              </Tabs>
            ) : (
              <p className="text-muted-foreground">No plans for this week.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden div for PDF content - will not be visible on the page */}
      <div style={{ display: "none" }}>
        <div ref={pdfContentRef} id="pdf-content"></div>
      </div>
    </div>
  )
}
