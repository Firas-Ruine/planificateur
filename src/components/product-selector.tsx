"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

export const products = [
  {
    id: "app-web",
    name: "Application Web (ARVEA International)",
  },
  {
    id: "app-mobile",
    name: "Application Mobile (ARVEA Business)",
  },
  {
    id: "arvea-shop",
    name: "ARVEA Shop (Le site e-commerce)",
  },
  {
    id: "arvea-data",
    name: "ARVEA DATA DRIVEN",
  },
]

interface ProductSelectorProps {
  onProductChange?: (productId: string) => void
  defaultProduct?: string
}

export function ProductSelector({ onProductChange, defaultProduct = "app-web" }: ProductSelectorProps) {
  const [selectedProduct, setSelectedProduct] = useState(products.find((p) => p.id === defaultProduct) || products[0])
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (product: (typeof products)[0]) => {
    setSelectedProduct(product)
    setIsOpen(false)
    if (onProductChange) {
      onProductChange(product.id)
    }
  }

  return (
    <div className="relative">
      <div className="mb-2 font-medium">Produit</div>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded border border-gray-300 bg-white p-3 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedProduct.name}</span>
        <ChevronDown className="h-5 w-5 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow-lg">
          <ul>
            {products.map((product) => (
              <li
                key={product.id}
                className="cursor-pointer p-3 hover:bg-gray-100"
                onClick={() => handleSelect(product)}
              >
                {product.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
