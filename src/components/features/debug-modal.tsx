"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DebugModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalSupport, setModalSupport] = useState<string>("Checking...")
  const [userAgent, setUserAgent] = useState<string>("Checking...")
  const [windowSize, setWindowSize] = useState<string>("Checking...")

  useEffect(() => {
    // Check if dialog element is supported
    const dialogSupported = typeof HTMLDialogElement !== "undefined"
    setModalSupport(dialogSupported ? "Supported" : "Not supported")
    
    // Set user agent safely
    setUserAgent(typeof navigator !== "undefined" ? navigator.userAgent : "Not available (SSR)")
    
    // Set window size safely
    if (typeof window !== "undefined") {
      setWindowSize(`${window.innerWidth}x${window.innerHeight}`)
    } else {
      setWindowSize("Not available (SSR)")
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-white">
            Debug
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modal Debug Info</DialogTitle>
            <DialogDescription>Information about modal support in this browser</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>Dialog Element:</strong> {modalSupport}
            </p>
            <p>
              <strong>User Agent:</strong> {userAgent}
            </p>
            <p>
              <strong>Window Size:</strong> {windowSize}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
