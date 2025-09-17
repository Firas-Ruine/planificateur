"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Toast, ToastClose, ToastTitle, ToastDescription } from "@/components/ui/toast"

export function ToastProvider() {
  const { toasts, dismissToast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} variant={toast.variant}>
          <div className="flex flex-col gap-1">
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
          </div>
          <ToastClose onClick={() => dismissToast(toast.id)} />
        </Toast>
      ))}
    </div>
  )
}
