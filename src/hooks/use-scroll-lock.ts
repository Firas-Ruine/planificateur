"use client"

import { useEffect } from "react"

/**
 * A hook to lock/unlock scrolling on the body element
 * @param lock Whether to lock scrolling
 * @param savePosition Whether to save and restore scroll position
 */
export function useScrollLock(lock: boolean, savePosition = true) {
  useEffect(() => {
    if (!lock) return

    // Save the current scroll position
    const scrollY = window.scrollY

    // Add a class to the body to prevent scrolling
    document.body.classList.add("dragging")

    if (savePosition) {
      // Fix body position to prevent scroll jumping
      document.body.style.top = `-${scrollY}px`
    }

    // Cleanup function to restore scrolling
    return () => {
      // Remove the class that prevents scrolling
      document.body.classList.remove("dragging")

      if (savePosition) {
        // Reset body position
        document.body.style.position = ""
        document.body.style.top = ""

        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [lock, savePosition])
}
