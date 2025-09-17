"use client"

import { CardTitle } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { User } from "@/types/user"

interface PlansListProps {
  startDate: Date
  endDate: Date
  selectedMemberIds: string[]
  isLoading: boolean
}

export function PlansList({ startDate, endDate, selectedMemberIds, isLoading }: PlansListProps) {
  const [plans, setPlans] = useState([]) // Replace 'any' with your Plan type
  const [members, setMembers] = useState<User[]>([]) // Replace 'any' with your User type

  useEffect(() => {
    // Mock data loading and filtering logic here
    const loadPlans = async () => {
      // Simulate loading
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Mock plans data
      const mockPlans = [
        { id: "1", memberId: "1", text: "Task 1 for Alice" },
        { id: "2", memberId: "2", text: "Task 1 for Bob" },
        { id: "3", memberId: "1", text: "Task 2 for Alice" },
        { id: "4", memberId: "3", text: "Task 1 for Charlie" },
      ]

      // Mock members data
      const mockMembers = [
        { id: "1", name: "Alice", avatar: "/placeholder.svg?height=40&width=40" },
        { id: "2", name: "Bob", avatar: "/placeholder.svg?height=40&width=40" },
        { id: "3", name: "Charlie", avatar: "/placeholder.svg?height=40&width=40" },
      ]

      // Filter plans based on selected members
      const filteredPlans =
        selectedMemberIds.length > 0 ? mockPlans.filter((plan) => selectedMemberIds.includes(plan.memberId)) : mockPlans

      setPlans(filteredPlans)
      setMembers(mockMembers)
    }

    if (!isLoading) {
      loadPlans()
    }
  }, [startDate, endDate, selectedMemberIds, isLoading])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.length > 0 ? (
        plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>Plan for {members.find((m) => m.id === plan.memberId)?.name || "Unknown"}</CardTitle>
            </CardHeader>
            <CardContent>{plan.text}</CardContent>
          </Card>
        ))
      ) : (
        <div className="col-span-full text-center py-8">No plans found for the selected criteria.</div>
      )}
    </div>
  )
}
