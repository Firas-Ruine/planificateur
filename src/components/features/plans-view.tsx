"use client"

import { useRef, useState, useEffect } from "react"
import type { Objective, Member } from "@/types"
import { ProgressBar } from "@/components/progress-bar"
import { ComplexityBadge } from "@/components/complexity-badge"
import { CriticalityBadge } from "@/components/criticality-badge"
import { MemberBadge } from "@/components/member-badge"
import { Share2, Check, Heart, AlertCircle, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { MemberFilter } from "../member-filter"

// Define the PlansViewProps interface
interface PlansViewProps {
  objectives: Objective[]
  teamMembers: Member[]
  productName: string
  weekRange: string
  weekId?: string
  loading?: boolean
  debugInfo?: any
  isSharedView?: boolean
  initialSelectedMembers?: string[]
}

export function PlansView({
  objectives,
  teamMembers,
  productName,
  weekRange,
  weekId,
  loading = false,
  debugInfo = {},
  isSharedView = false,
  initialSelectedMembers = [], // Default to empty array
}: PlansViewProps) {
  // Add this near the beginning of the component to log the data received
  useEffect(() => {
    if (isSharedView) {
      console.log("Shared view received data:", {
        productName,
        weekRange,
        objectivesCount: objectives.length,
        tasksCount: objectives.reduce((acc, obj) => acc + obj.tasks.length, 0),
        initialSelectedMembers,
      })
    }
  }, [isSharedView, objectives, productName, weekRange, initialSelectedMembers])

  // Add print styles - Fixed to avoid syntax errors
  useEffect(() => {
    // Add a style tag for print-specific styles
    const style = document.createElement("style")
    style.innerHTML = `
      @media print {
        img { 
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }
        .member-avatar {
          display: block !important;
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          width: 210mm;
          height: 297mm;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Add this useEffect to include print-for-PDF specific styles
  useEffect(() => {
    // Add a style tag for print-for-PDF specific styles
    const style = document.createElement("style")
    style.innerHTML = `
    @media print {
      .printing-for-pdf .no-print {
        display: none !important;
      }
      .printing-for-pdf img { 
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
      .printing-for-pdf .member-avatar {
        display: block !important;
        print-color-adjust: exact !important;
      }
      @page {
        size: A4;
        margin: 10mm;
      }
    }
  `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const planRef = useRef<HTMLDivElement>(null)
  const printFrameRef = useRef<HTMLIFrameElement | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [displayedObjectives, setDisplayedObjectives] = useState<Objective[]>([])
  const [isMembersLoading, setIsMembersLoading] = useState(true)
  const { toast } = useToast()

  // Update state for member filtering to support multiple selections
  // Initialize with any provided initialSelectedMembers, but only on first render
  const [selectedMembers, setSelectedMembers] = useState<string[]>(initialSelectedMembers)

  // Add a useEffect to handle changes to initialSelectedMembers
  useEffect(() => {
    // Only update if we're in shared view and have initialSelectedMembers
    if (isSharedView && initialSelectedMembers.length > 0) {
      setSelectedMembers(initialSelectedMembers)
    }
  }, [isSharedView, initialSelectedMembers])

  // Effect to process objectives when they change
  useEffect(() => {
    if (!objectives || objectives.length === 0) {
      setDisplayedObjectives([])
      return
    }

    // Log the objectives we received
    console.log(`Processing ${objectives.length} objectives for display`)

    // Sort objectives by position
    const sortedObjectives = [...objectives].sort((a, b) => (a.position || 0) - (b.position || 0))

    // Ensure each objective has its tasks sorted
    const processedObjectives = sortedObjectives.map((obj) => {
      return {
        ...obj,
        tasks: [...obj.tasks].sort((a, b) => (a.position || 0) - (b.position || 0)),
      }
    })

    setDisplayedObjectives(processedObjectives)

    // Only set loading state when objectives change
    if (objectives.length > 0) {
      setIsMembersLoading(true)

      // After a short delay, finish loading
      const timer = setTimeout(() => {
        setIsMembersLoading(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [objectives])

  // Update the filter function to handle multiple member selections
  const getFilteredObjectives = () => {
    if (selectedMembers.length === 0) {
      return displayedObjectives
    }

    return displayedObjectives
      .map((objective) => {
        // Keep the objective but filter its tasks
        return {
          ...objective,
          tasks: objective.tasks.filter((task) => task.assignee && selectedMembers.includes(task.assignee)),
        }
      })
      .filter((objective) => objective.tasks.length > 0) // Only keep objectives with matching tasks
  }

  // Get the filtered objectives
  const filteredObjectives = getFilteredObjectives()

  // Get unique members that have tasks assigned in the current objectives
  // const getMembersWithTasks = () => {
  //   const memberIds = new Set<string>()

  //   displayedObjectives.forEach((objective) => {
  //     objective.tasks.forEach((task) => {
  //       if (task.assignee) {
  //         memberIds.add(task.assignee)
  //       }
  //     })
  //   })

  //   return Array.from(memberIds)
  //     .map((id) => teamMembers.find((member) => member.id === id))
  //     .filter((member) => member !== undefined) as Member[]
  // }

  // const membersWithTasks = getMembersWithTasks()
  const membersWithTasks = teamMembers

  const generateShareableLink = () => {
    // Safety check for productName
    if (!productName) {
      console.warn("Product name is undefined in generateShareableLink")
      return `${window.location.origin}/shared-plan/unknown/unknown`
    }

    // Create a URL-friendly string from product name
    let productSlug = productName.trim()

    // For "Application Mobile (ARVEA Business)", we want "application mobile"
    // Extract the main product name without parentheses
    const mainProductName = productName.split("(")[0].trim()

    // Convert to lowercase and replace special chars with spaces
    productSlug = mainProductName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ")

    // Encode the product name for URL safety
    productSlug = encodeURIComponent(productSlug)

    // Safety check for weekRange
    if (!weekRange) {
      console.warn("Week range is undefined in generateShareableLink")
      return `${window.location.origin}/shared-plan/${productSlug}/unknown`
    }

    try {
      let startDate, endDate

      // Check if the weekRange is in the format "Semaine du [start_date] au [end_date]"
      if (weekRange.startsWith("Semaine du ")) {
        // Extract dates using regex
        const regex = /Semaine du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/
        const matches = weekRange.match(regex)

        if (matches && matches.length === 3) {
          startDate = matches[1]
          endDate = matches[2]
          console.log("Extracted dates from 'Semaine du' format:", { startDate, endDate })
        } else {
          throw new Error(`Could not extract dates from week range: ${weekRange}`)
        }
      } else {
        // Try the original format with " - " separator
        const parts = weekRange.split(" - ")

        if (parts.length !== 2) {
          throw new Error(`Invalid week range format: ${weekRange}`)
        }

        startDate = parts[0]
        endDate = parts[1]
      }

      // Additional safety checks for the dates
      if (!startDate || !endDate) {
        throw new Error("Start date or end date is missing")
      }

      // Ensure consistent date format DD-MM-YYYY
      const formatDatePart = (datePart: string) => {
        // If the date is already in DD-MM-YYYY format, return it
        if (/^\d{2}-\d{2}-\d{4}$/.test(datePart)) {
          return datePart
        }

        // If the date is in DD/MM/YYYY format, convert to DD-MM-YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
          return datePart.replace(/\//g, "-")
        }

        // Try to parse other formats
        const parts = datePart.split(/[/\-.]/)
        if (parts.length === 3) {
          // Assume DD/MM/YYYY format
          return `${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[2].padStart(4, "0")}`
        }

        // If all else fails, return the original
        return datePart
      }

      const formattedStartDate = formatDatePart(startDate)
      const formattedEndDate = formatDatePart(endDate)

      const dateSlug = `${formattedStartDate}--to--${formattedEndDate}`

      // Create the base URL
      let shareableLink = `${window.location.origin}/shared-plan/${productSlug}/${dateSlug}`

      // Add selected members as query parameters if any are selected
      if (selectedMembers.length > 0) {
        const memberParam = selectedMembers.join(",")
        shareableLink += `?members=${encodeURIComponent(memberParam)}`
      }

      // Log the generated URL for debugging
      console.log("Generated shareable link:", shareableLink)

      return shareableLink
    } catch (error) {
      console.error("Error generating shareable link:", error)

      // Try a last-resort extraction of any dates in the string
      try {
        const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g
        const allDates = weekRange.match(dateRegex)

        if (allDates && allDates.length >= 2) {
          const startDate = allDates[0].replace(/\//g, "-")
          const endDate = allDates[1].replace(/\//g, "-")
          const dateSlug = `${startDate}--to--${endDate}`
          console.log("Extracted dates using last-resort method:", { startDate, endDate })

          let shareableLink = `${window.location.origin}/shared-plan/${productSlug}/${dateSlug}`

          // Add selected members as query parameters if any are selected
          if (selectedMembers.length > 0) {
            const memberParam = selectedMembers.join(",")
            shareableLink += `?members=${encodeURIComponent(memberParam)}`
          }

          return shareableLink
        }
      } catch (fallbackError) {
        console.error("Even fallback date extraction failed:", fallbackError)
      }

      // Fallback to a safe URL with the current date
      const today = new Date()
      const formattedDate = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getFullYear()}`

      let shareableLink = `${window.location.origin}/shared-plan/${productSlug}/${formattedDate}--to--${formattedDate}`

      // Add selected members as query parameters if any are selected
      if (selectedMembers.length > 0) {
        const memberParam = selectedMembers.join(",")
        shareableLink += `?members=${encodeURIComponent(memberParam)}`
      }

      return shareableLink
    }
  }

  const handleShare = async () => {
    try {
      const shareableLink = generateShareableLink()

      // Log the link for debugging
      console.log("Generated shareable link:", shareableLink)

      await navigator.clipboard.writeText(shareableLink)
      setIsCopied(true)
      toast({
        title: "Lien copié !",
        description: "Le lien a été copié dans votre presse-papiers.",
      })

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (err) {
      console.error("Error sharing link:", err)
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  // Function to get the logo URL based on the product name
  const getProductLogo = (productName: string): string => {
    if (productName.toLowerCase().includes("shop")) {
      return "https://arveatest.s3.eu-west-3.amazonaws.com/ARVEA_Shop.png"
    } else if (productName.toLowerCase().includes("business")) {
      return "https://arveatest.s3.eu-west-3.amazonaws.com/ARVEA_Business.png"
    } else if (productName.toLowerCase().includes("international")) {
      return "https://arveatest.s3.eu-west-3.amazonaws.com/ARVEA_Inter.png"
    } else if (productName.toLowerCase().includes("data")) {
      return "https://arveatest.s3.eu-west-3.amazonaws.com/ARVEA_Data.png"
    }
    // Default logo if no match
    return "https://arveatest.s3.eu-west-3.amazonaws.com/Maisonduweb.png"
  }

  // Get the selected member objects
  const getSelectedMemberObjects = () => {
    if (selectedMembers.length === 0) return []
    return teamMembers.filter((member) => selectedMembers.includes(member.id))
  }

  const selectedMemberObjects = getSelectedMemberObjects()

  // Create a print-ready version of the content in an iframe
  const createPrintFrame = () => {
    // Remove any existing print frame
    if (printFrameRef.current) {
      document.body.removeChild(printFrameRef.current)
    }

    // Create a new iframe
    const iframe = document.createElement("iframe")
    iframe.style.position = "absolute"
    iframe.style.top = "-9999px"
    iframe.style.left = "-9999px"
    iframe.style.width = "210mm"
    iframe.style.height = "297mm"
    document.body.appendChild(iframe)
    printFrameRef.current = iframe

    // Get the iframe document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return null

    // Write the basic HTML structure
    iframeDoc.open()
    iframeDoc.write(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Plan de la semaine - ${productName}</title>
    <meta charset="utf-8">
    <style>
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        margin: 0;
        padding: 0;
        color: #333;
        line-height: 1.5;
        background-color: white;
      }
      .page {
        width: 190mm;
        height: 277mm;
        padding: 10mm;
        margin: 0 auto;
        position: relative;
        background: white;
        page-break-after: always;
      }
      .header {
        text-align: center;
        margin-bottom: 15mm;
        padding-bottom: 5mm;
        border-bottom: 1px solid #eee;
      }
      .logo-container {
        display: flex;
        justify-content: center;
        margin-bottom: 10mm;
      }
      .logo {
        width: 40mm;
        height: 20mm;
        object-fit: contain;
        border: 1px solid #eee;
        border-radius: 5mm;
        padding: 2mm;
      }
      h1 {
        font-size: 28pt;
        margin: 0 0 5mm 0;
        color: #1a202c;
      }
      h2 {
        font-size: 18pt;
        margin: 10mm 0 5mm 0;
        padding-bottom: 2mm;
        border-bottom: 1px solid #eee;
        color: #2d3748;
      }
      h3 {
        font-size: 14pt;
        margin: 0 0 3mm 0;
        color: #4a5568;
      }
      h4 {
        font-size: 12pt;
        margin: 0;
        color: #4a5568;
      }
      p {
        margin: 0 0 3mm 0;
      }
      .content {
        margin-bottom: 15mm;
      }
      .objective-overview {
        margin-bottom: 10mm;
        page-break-inside: avoid;
      }
      .objective-row {
        display: flex;
        align-items: center;
        background-color: #f7fafc;
        padding: 5mm;
        border-radius: 2mm;
      }
      .objective-number {
        width: 15mm;
        height: 15mm;
        border-radius: 50%;
        background-color: #4c6ef5;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16pt;
        margin-right: 5mm;
        flex-shrink: 0;
      }
      .objective-content {
        flex-grow: 1;
      }
      .objective-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3mm;
      }
      .progress-text {
        color: #4c6ef5;
        font-weight: 500;
      }
      .progress-bar {
        height: 5mm;
        background-color: #e2e8f0;
        border-radius: 2.5mm;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background-color: #4c6ef5;
      }
      .objective-detail {
        margin-bottom: 15mm;
        page-break-inside: avoid;
      }
      .objective-header {
        display: flex;
        align-items: center;
        margin-bottom: 5mm;
      }
      .objective-number-detail {
        width: 12mm;
        height: 12mm;
        border-radius: 50%;
        background-color: #e6e9ff;
        color: #4c6ef5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14pt;
        margin-right: 5mm;
        flex-shrink: 0;
      }
      .tasks-container {
        margin-left: 17mm;
      }
      .task {
        padding: 4mm;
        border: 1px solid #e2e8f0;
        border-radius: 2mm;
        margin-bottom: 5mm;
        page-break-inside: avoid;
        background-color: white;
      }
      .task.completed {
        background-color: #f7fafc;
      }
      .task-header {
        display: flex;
        align-items: center;
        margin-bottom: 3mm;
      }
      .task-number {
        width: 8mm;
        height: 8mm;
        border-radius: 50%;
        background-color: #e6e9ff;
        color: #4c6ef5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 3mm;
        font-size: 10pt;
        flex-shrink: 0;
      }
      .task-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 2mm;
        margin-bottom: 3mm;
      }
      .badge {
        display: inline-block;
        padding: 1mm 2mm;
        border-radius: 1mm;
        font-size: 9pt;
        margin-right: 2mm;
      }
      .complexity-low {
        background-color: #e6fffa;
        color: #319795;
        border: 1px solid #81e6d9;
      }
      .complexity-medium {
        background-color: #ebf8ff;
        color: #3182ce;
        border: 1px solid #90cdf4;
      }
      .complexity-high {
        background-color: #faf5ff;
        color: #805ad5;
        border: 1px solid #d6bcfa;
      }
      .criticality-low {
        background-color: #f0fff4;
        color: #38a169;
        border: 1px solid #9ae6b4;
      }
      .criticality-medium {
        background-color: #fffaf0;
        color: #dd6b20;
        border: 1px solid #fbd38d;
      }
      .criticality-high {
        background-color: #fff5f5;
        color: #e53e3e;
        border: 1px solid #feb2b2;
      }
      .member {
        display: flex;
        align-items: center;
        margin-top: 3mm;
      }
      .member-avatar {
        width: 8mm;
        height: 8mm;
        border-radius: 50%;
        background-color: #e2e8f0;
        margin-right: 3mm;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9pt;
        color: #4a5568;
        overflow: hidden;
        flex-shrink: 0;
      }
      .member-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .completed-badge {
        background-color: #f0fff4;
        color: #38a169;
        border: 1px solid #9ae6b4;
        font-size: 9pt;
        padding: 0.5mm 1mm;
        border-radius: 1mm;
        margin-left: 3mm;
      }
      .footer {
        position: absolute;
        bottom: 10mm;
        left: 10mm;
        right: 10mm;
        padding-top: 5mm;
        border-top: 1px solid #eee;
        text-align: center;
        font-size: 9pt;
        color: #718096;
      }
      .page-number {
        position: absolute;
        bottom: 5mm;
        left: 10mm;
        font-size: 9pt;
        color: #718096;
      }
      .timestamp {
        position: absolute;
        bottom: 5mm;
        right: 10mm;
        font-size: 9pt;
        color: #718096;
      }
      .filtered-info {
        font-size: 10pt;
        color: #4c6ef5;
        margin-top: 2mm;
      }
      .heart-icon {
        color: #e53e3e;
        font-size: 10pt;
      }
    </style>
  </head>
  <body>
    <div id="pdf-content"></div>
  </body>
  </html>
`)
    iframeDoc.close()

    // Get the content container
    const contentContainer = iframeDoc.getElementById("pdf-content")
    if (!contentContainer) return null

    // Generate the overview page
    const overviewPage = document.createElement("div")
    overviewPage.className = "page"
    overviewPage.innerHTML = `
  <div class="header">
    <h1>Aperçu des objectifs</h1>
    <p style="font-size: 14pt; margin-bottom: 2mm;">${productName}</p>
    <p style="font-size: 10pt; color: #718096;">${weekRange}</p>
    ${
      selectedMembers.length > 0
        ? `<p class="filtered-info">Filtré: ${selectedMembers.length} ${selectedMembers.length === 1 ? "membre" : "membres"}</p>`
        : ""
    }
    ${
      isSharedView
        ? `<p style="font-size: 8pt; color: #5a67d8; margin-top: 2mm;">Vue partagée • Accédée le ${new Date().toLocaleDateString("fr-FR")}</p>`
        : ""
    }
  </div>

  <div class="content">
    ${
      filteredObjectives.length === 0
        ? `<p style="text-align: center; font-style: italic; color: #718096; padding: 5mm 0;">
        ${
          selectedMembers.length > 0
            ? `Aucune tâche trouvée pour ${selectedMembers.length === 1 ? "ce membre" : "ces membres"}.`
            : "Aucun objectif planifié pour cette semaine."
        }
      </p>`
        : filteredObjectives
            .map(
              (obj, index) => `
        <div class="objective-overview">
          <div class="objective-row">
            <div class="objective-number">${index + 1}</div>
            <div class="objective-content">
              <div class="objective-header">
                <h3>${obj.title}</h3>
                <span class="progress-text">${obj.progress}% complété</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${obj.progress}%;"></div>
              </div>
            </div>
          </div>
        </div>
      `,
            )
            .join("")
    }
  </div>

  <div class="footer">
    <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
    <p style="margin-top: 1mm;">Made with <span class="heart-icon">♥</span> by MDW</p>
  </div>
`
    contentContainer.appendChild(overviewPage)

    // Generate task detail pages
    if (filteredObjectives.length > 0) {
      // Split objectives into pages with approximately 3-4 objectives per page
      const objectivesPerPage = 3
      const pagesArray = []
      let currentPage = []
      let currentObjectiveCount = 0

      for (let i = 0; i < filteredObjectives.length; i++) {
        const obj = filteredObjectives[i]

        // If adding this objective would exceed the limit, start a new page
        if (currentObjectiveCount >= objectivesPerPage && currentPage.length > 0) {
          pagesArray.push([...currentPage])
          currentPage = []
          currentObjectiveCount = 0
        }

        currentPage.push(obj)
        currentObjectiveCount += 1
      }

      // Add any remaining objectives to the last page
      if (currentPage.length > 0) {
        pagesArray.push(currentPage)
      }

      // Create each page
      pagesArray.forEach((pageObjectives) => {
        const taskPage = document.createElement("div")
        taskPage.className = "page"
        taskPage.innerHTML = `
      <div class="header">
        <h1>Détail des tâches</h1>
        <p style="font-size: 14pt; margin-bottom: 2mm;">${productName}</p>
        <p style="font-size: 10pt; color: #718096;">${weekRange}</p>
      </div>
      <div class="content">
        ${pageObjectives
          .map((obj, objIndex) => {
            const globalObjIndex = filteredObjectives.indexOf(obj)
            return `
              <div class="objective-detail">
                <div class="objective-header">
                  <div class="objective-number-detail">${globalObjIndex + 1}</div>
                  <h3>${obj.title}</h3>
                </div>
                ${
                  obj.tasks.length === 0
                    ? `<p style="font-style: italic; color: #718096; margin-left: 13mm;">Aucune tâche pour cet objectif.</p>`
                    : `<div class="tasks-container">
                        ${obj.tasks
                          .map((task, taskIndex) => {
                            const assignedMember = task.assignee
                              ? teamMembers.find((m) => m.id === task.assignee)
                              : null

                            return `
                              <div class="task ${task.completed ? "completed" : ""}">
                                <div class="task-header">
                                  <div class="task-number">${taskIndex + 1}</div>
                                  <h4 style="${task.completed ? "text-decoration: line-through; color: #718096;" : ""}">${task.title}</h4>
                                </div>
                                <div class="task-badges">
                                  <span class="badge ${
                                    task.complexity === "low"
                                      ? "complexity-low"
                                      : task.complexity === "medium"
                                        ? "complexity-medium"
                                        : "complexity-high"
                                  }">
                                    ${
                                      task.complexity === "low"
                                        ? "Complexité: Faible"
                                        : task.complexity === "medium"
                                          ? "Complexité: Moyenne"
                                          : "Complexité: Élevée"
                                    }
                                  </span>
                                  <span class="badge ${
                                    task.criticality === "low"
                                      ? "criticality-low"
                                      : task.criticality === "medium"
                                        ? "criticality-medium"
                                        : "criticality-high"
                                  }">
                                    ${
                                      task.criticality === "low"
                                        ? "Criticité: Faible"
                                        : task.criticality === "medium"
                                          ? "Criticité: Moyenne"
                                          : "Criticité: Élevée"
                                    }
                                  </span>
                                </div>
                                ${
                                  assignedMember
                                    ? `<div class="member">
                                        <div class="member-avatar">
                                          ${
                                            assignedMember.avatar
                                              ? `<img src="${assignedMember.avatar}" alt="${assignedMember.name}" />`
                                              : `<span>${assignedMember.initials || assignedMember.name.charAt(0)}</span>`
                                          }
                                        </div>
                                        <span>${assignedMember.name}</span>
                                        ${task.completed ? '<span class="completed-badge">Complété</span>' : ""}
                                      </div>`
                                    : ""
                                }
                              </div>
                            `
                          })
                          .join("")}
                      </div>`
                }
              </div>
            `
          })
          .join("")}
      </div>
      <div class="footer">
        <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
        <p style="margin-top: 1mm;">Made with <span class="heart-icon">♥</span> by MDW</p>
      </div>
    `
        contentContainer.appendChild(taskPage)
      })
    } else {
      // If no objectives, add an empty task page
      const emptyTaskPage = document.createElement("div")
      emptyTaskPage.className = "page"
      emptyTaskPage.innerHTML = `
    <div class="header">
      <h1>Détail des tâches</h1>
      <p style="font-size: 14pt; margin-bottom: 2mm;">${productName}</p>
      <p style="font-size: 10pt; color: #718096;">${weekRange}</p>
    </div>
    <div class="content">
      <p style="text-align: center; font-style: italic; color: #718096; padding: 5mm 0;">
        ${
          selectedMembers.length > 0
            ? `Aucune tâche trouvée pour ${selectedMembers.length === 1 ? "ce membre" : "ces membres"}.`
            : "Aucune tâche planifiée pour cette semaine."
        }
      </p>
    </div>
    <div class="footer">
      <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
      <p style="margin-top: 1mm;">Made with <span class="heart-icon">♥</span> by MDW</p>
    </div>
  `
      contentContainer.appendChild(emptyTaskPage)
    }

    // Add page numbers
    const pages = iframeDoc.querySelectorAll(".page")
    pages.forEach((page, index) => {
      const pageNumberDiv = document.createElement("div")
      pageNumberDiv.className = "page-number"
      pageNumberDiv.textContent = `Page ${index + 1} / ${pages.length}`
      page.appendChild(pageNumberDiv)
    })

    return iframe
  }

  // Replace the handleDownloadPDF function with this simpler version that uses the browser's print functionality
  const handleDownloadPDF = () => {
    // Add a temporary class to the body to indicate we're printing for PDF
    document.body.classList.add("printing-for-pdf")

    // Show a toast to guide the user
    toast({
      title: "Impression pour PDF",
      description:
        "Dans la boîte de dialogue d'impression, sélectionnez 'Enregistrer au format PDF' ou 'Microsoft Print to PDF'.",
    })

    // Use the browser's print functionality
    window.print()

    // Remove the temporary class after printing
    setTimeout(() => {
      document.body.classList.remove("printing-for-pdf")
    }, 1000)
  }

  // Update the return statement in the PlansView component to handle empty data
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6 bg-white border shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Plan de la semaine
                {isSharedView && (
                  <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    Vue partagée
                  </span>
                )}
              </h1>
              <p className="text-gray-600">
                {productName || "Produit non spécifié"}
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> - </span>
                {weekRange || "Semaine non spécifiée"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <>
                    {filteredObjectives.length} objectifs •{" "}
                    {filteredObjectives.reduce((acc, obj) => acc + obj.tasks.length, 0)} tâches
                    {selectedMemberObjects.length > 0 && (
                      <span className="ml-2 text-blue-600">
                        • Filtré: {selectedMemberObjects.length}{" "}
                        {selectedMemberObjects.length === 1 ? "membre" : "membres"}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleShare}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Lien copié</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          <span>Partager</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copier le lien de partage</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="outline"
                size="default"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Télécharger PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Add the member filter UI showing all team members */}
          <div className="mb-6 no-print">
            <MemberFilter
              members={teamMembers}
              selectedMembers={selectedMembers}
              onMemberSelect={(selectedIds) => {
                setSelectedMembers(selectedIds)
              }}
              isLoading={isMembersLoading}
            />
          </div>

          {/* Display a warning if we have no objectives */}
          {!loading && filteredObjectives.length === 0 && (
            <Alert className="mb-6 bg-amber-50 border-amber-200 no-print">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {selectedMembers.length > 0
                  ? `Aucune tâche trouvée pour ${selectedMembers.length === 1 ? "ce membre" : "ces membres"}. Veuillez sélectionner d'autres membres ou cliquer sur "Sélectionner tout".`
                  : "Aucun objectif trouvé pour cette semaine et ce produit. Veuillez vérifier les paramètres ou essayer une autre semaine."}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading state for the entire plan */}
          {loading && (
            <div className="space-y-4 mb-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {/* Plan Preview */}
          {!loading && (
            <div ref={planRef} className="p-8 bg-white min-h-[29.7cm] w-full print:p-0 print:shadow-none">
              {/* Header */}
              <div className="text-center mb-8 pb-6 border-b">
                <div className="flex justify-center mb-4">
                  <div className="w-40 h-20 rounded-2xl bg-white flex items-center justify-center p-2 border border-gray-200">
                    <img
                      src={getProductLogo(productName) || "/placeholder.svg"}
                      alt={`${productName} Logo`}
                      className="max-w-full max-h-full object-contain"
                      style={{ printColorAdjust: "exact" }}
                    />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan de la semaine</h1>
                <p className="text-xl text-gray-600 mb-1">{productName}</p>
                <p className="text-sm text-gray-500">{weekRange}</p>
                {selectedMemberObjects.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    Filtré: {selectedMemberObjects.length} {selectedMemberObjects.length === 1 ? "membre" : "membres"}
                  </p>
                )}
                {isSharedView && (
                  <p className="text-xs text-indigo-600 mt-2">
                    Vue partagée • Accédée le {new Date().toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>

              {/* Objectives Overview */}
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b">
                  Aperçu des objectifs ({filteredObjectives.length})
                </h2>

                {filteredObjectives.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-4">
                    {selectedMembers.length > 0
                      ? `Aucune tâche trouvée pour ${selectedMembers.length === 1 ? "ce membre" : "ces membres"}.`
                      : "Aucun objectif planifié pour cette semaine."}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredObjectives.map((obj, index) => (
                      <div key={obj.id} className="flex items-center bg-gray-50 p-4 rounded-lg no-break">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mr-4 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium text-lg">{obj.title}</h3>
                            <span className="text-indigo-600 font-medium">{obj.progress}% complété</span>
                          </div>
                          <ProgressBar progress={obj.progress} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks Details */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b">
                  Détail des tâches ({filteredObjectives.reduce((acc, obj) => acc + obj.tasks.length, 0)})
                </h2>

                {filteredObjectives.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-4">
                    {selectedMembers.length > 0
                      ? `Aucune tâche trouvée pour ${selectedMembers.length === 1 ? "ce membre" : "ces membres"}.`
                      : "Aucune tâche planifiée pour cette semaine."}
                  </p>
                ) : (
                  <div className="space-y-8">
                    {filteredObjectives.map((obj, objIndex) => (
                      <div key={obj.id} className="mb-8 no-break">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">
                            {objIndex + 1}
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">{obj.title}</h3>
                        </div>

                        {obj.tasks.length === 0 ? (
                          <p className="text-gray-500 italic ml-11">Aucune tâche pour cet objectif.</p>
                        ) : (
                          <div className="ml-11 space-y-3">
                            {obj.tasks.map((task, taskIndex) => {
                              const assignedMember = task.assignee
                                ? teamMembers.find((m) => m.id === task.assignee)
                                : null

                              return (
                                <div
                                  key={task.id}
                                  className={`p-4 rounded-lg border ${task.completed ? "bg-gray-50" : "bg-white"} no-break`}
                                >
                                  <div className="flex items-start">
                                    <div className="flex-grow">
                                      <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-medium">
                                          {taskIndex + 1}
                                        </span>
                                        <h4
                                          className={`font-medium ${
                                            task.completed ? "line-through text-gray-500" : "text-gray-800"
                                          }`}
                                        >
                                          {task.title}
                                        </h4>
                                      </div>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <ComplexityBadge complexity={task.complexity} />
                                        <CriticalityBadge criticality={task.criticality} />
                                      </div>

                                      {assignedMember && (
                                        <div className="mt-3">
                                          <MemberBadge member={assignedMember} size="md" />
                                          {task.completed && (
                                            <span className="ml-2 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                              Complété
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
                <p>
                  Document généré le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR")}
                </p>
                <p className="mt-1">
                  Made with <Heart className="inline h-4 w-4 text-red-500 mx-1" fill="currentColor" /> by MDW
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
