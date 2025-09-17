import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface PDFOptions {
  scale?: number
  quality?: number
  pageFormat?: string
  orientation?: "portrait" | "landscape"
}

export async function generatePDF(element: HTMLElement, filename: string, options: PDFOptions = {}): Promise<void> {
  const { scale = 2, quality = 1, pageFormat = "a4", orientation = "portrait" } = options

  try {
    // Capture the element as a canvas
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: "#ffffff",
    })

    // Calculate dimensions
    const imgData = canvas.toDataURL("image/jpeg", quality)
    const pdf = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: pageFormat,
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = canvas.width
    const imgHeight = canvas.height

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 30 // Add some margin at the top

    // Add the image to the PDF
    pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // Check if content exceeds page height and add more pages if needed
    let heightLeft = imgHeight * ratio - (pdfHeight - imgY)
    let position = imgY

    while (heightLeft > 0) {
      position = 0
      pdf.addPage()
      pdf.addImage(
        imgData,
        "JPEG",
        imgX,
        position - (imgHeight * ratio - heightLeft),
        imgWidth * ratio,
        imgHeight * ratio,
      )
      heightLeft -= pdfHeight
    }

    // Save the PDF
    pdf.save(filename)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}
