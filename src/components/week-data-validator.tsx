"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { Objective } from "@/types"

interface WeekDataValidatorProps {
  objectives: Objective[]
  weekId: string
}

export function WeekDataValidator({ objectives, weekId }: WeekDataValidatorProps) {
  const [invalidObjectives, setInvalidObjectives] = useState<Objective[]>([])
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    // Find any objectives that don't match the current week ID
    const invalid = objectives.filter((obj) => obj.weekId !== weekId)
    setInvalidObjectives(invalid)
    setIsValid(invalid.length === 0)
  }, [objectives, weekId])

  if (isValid) {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Données valides</AlertTitle>
        <AlertDescription className="text-green-700">
          Tous les objectifs ({objectives.length}) appartiennent à la semaine actuelle ({weekId}).
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-4 bg-red-50 border-red-200">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Données incorrectes détectées</AlertTitle>
      <AlertDescription className="text-red-700">
        {invalidObjectives.length} objectif(s) sur {objectives.length} n'appartiennent pas à la semaine actuelle (
        {weekId}).
        <div className="mt-2 text-xs">
          Semaines incorrectes: {Array.from(new Set(invalidObjectives.map((obj) => obj.weekId))).join(", ")}
        </div>
      </AlertDescription>
    </Alert>
  )
}
