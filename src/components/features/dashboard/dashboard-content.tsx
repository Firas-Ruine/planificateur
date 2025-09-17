"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getObjectives, getStatistics, getTeamMembers } from "@/services/firebase-service"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { WeeklyObjectives } from "@/components/dashboard/weekly-objectives"
import type { Product } from "@/types"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { ProductProgress } from "./product-progress"
import { TeamProgress } from "./team-progress"

interface DashboardContentProps {
  products: Product[]
  weekId: string
  weekRange: { start: Date; end: Date }
}

export function DashboardContent({ products, weekId, weekRange }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState(products[0]?.id || "")
  const [statistics, setStatistics] = useState<any>(null)
  const [objectives, setObjectives] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (activeTab) {
        setLoading(true)
        try {
          // Use the weekId parameter to fetch only objectives for the current week
          const stats = await getStatistics(activeTab, weekId)
          const objs = await getObjectives(activeTab, weekId)
          const members = await getTeamMembers()

          setStatistics(stats)
          setObjectives(objs)
          setTeamMembers(members)
        } catch (error) {
          console.error("Error loading dashboard data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadData()
  }, [activeTab, weekId])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {products.map((product) => (
            <TabsTrigger key={product.id} value={product.id}>
              {product.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {products.map((product) => (
          <TabsContent key={product.id} value={product.id}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Weekly Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductProgress statistics={statistics} />
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Team Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamProgress statistics={statistics} teamMembers={teamMembers} />
                </CardContent>
              </Card>

              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Weekly Objectives</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeeklyObjectives
                    objectives={objectives}
                    teamMembers={teamMembers}
                    productId={product.id}
                    weekId={weekId}
                  />
                </CardContent>
              </Card>

              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentActivity objectives={objectives} weekRange={weekRange} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
