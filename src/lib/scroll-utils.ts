/**
 * Lock scrolling on the body element
 */
export function lockScroll(): void {
  // Save the current scroll position
  const scrollY = window.scrollY

  // Store the current scroll position as a data attribute
  document.body.setAttribute("data-scroll-position", scrollY.toString())

  // Add a class to the body to prevent scrolling
  document.body.classList.add("dragging")

  // Apply inline styles to prevent scrolling
  document.body.style.overflow = "hidden"
  document.body.style.touchAction = "none"
  document.body.style.position = "relative" // Use relative instead of fixed to avoid jumps
}

/**
 * Unlock scrolling on the body element
 */
export function unlockScroll(): void {
  // Get the saved scroll position
  const scrollY = Number.parseInt(document.body.getAttribute("data-scroll-position") || "0", 10)

  // Remove the class that prevents scrolling
  document.body.classList.remove("dragging")

  // Reset body styles
  document.body.style.overflow = ""
  document.body.style.touchAction = ""
  document.body.style.position = ""

  // Restore scroll position
  window.scrollTo(0, scrollY)
}
