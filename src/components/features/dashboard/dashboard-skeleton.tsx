import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Product stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="mt-2 h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress sections skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              <Skeleton className="h-5 w-1/3" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              <Skeleton className="h-5 w-1/3" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weekly objectives skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>
            <Skeleton className="h-5 w-1/3" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4 p-3 border rounded-md">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent activity skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>
            <Skeleton className="h-5 w-1/3" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3 mb-1" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
