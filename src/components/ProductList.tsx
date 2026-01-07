'use client'

import { ProductState } from '@/types/product'
import { ProductRow } from './ProductRow'

interface ProductListProps {
  products: ProductState[]
  onToggleHay: (id: string) => void
  onToggleComprado: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
}

export function ProductList({
  products,
  onToggleHay,
  onToggleComprado,
  onUpdateQuantity
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg">No hay productos que coincidan con el filtro</p>
        <p className="text-sm mt-2">Prueba cambiando el filtro o agregando productos</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Desktop Header - hidden on mobile */}
      <div className="hidden md:grid md:grid-cols-[1fr_80px_60px_60px] gap-4 px-3 py-2 border-b border-card-border text-sm font-medium text-muted">
        <div>Artículo</div>
        <div className="text-center">Cantidad</div>
        <div className="text-center">Hay</div>
        <div className="text-center">Comprado</div>
      </div>

      {/* Product rows */}
      <div className="flex flex-col gap-3 md:gap-0">
        {products.map(product => (
          <ProductRow
            key={product.id}
            product={product}
            onToggleHay={onToggleHay}
            onToggleComprado={onToggleComprado}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>
    </div>
  )
}
