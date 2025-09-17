import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/progress-bar"
import type { Product } from "@/types"

interface ProductProgressProps {
  products: Product[]
  productStats: Record<string, { complete: number; total: number }>
}

export function ProductProgress({ products, productStats }: ProductProgressProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Product Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product) => {
          const stats = productStats[product.id] || { complete: 0, total: 0 }
          const progress = stats.total > 0 ? (stats.complete / stats.total) * 100 : 0

          return (
            <div key={product.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{product.name}</span>
                <span className="text-xs text-muted-foreground">
                  {stats.complete}/{stats.total} tasks
                </span>
              </div>
              <ProgressBar progress={progress} bgColor={`bg-${product.color || "blue"}-500`} />
            </div>
          )
        })}

        {products.length === 0 && <div className="py-6 text-center text-muted-foreground">No products available</div>}
      </CardContent>
    </Card>
  )
}
