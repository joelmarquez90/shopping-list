'use client'

import { ProductState } from '@/types/product'
import { ProductRow } from './ProductRow'

interface ProductListProps {
  products: ProductState[]
  onToggleHay: (id: string) => void
  onToggleComprado: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  loading?: boolean
  error?: string | null
}

export function ProductList({
  products,
  onToggleHay,
  onToggleComprado,
  onUpdateQuantity,
  loading = false,
  error = null
}: ProductListProps) {
  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12 text-muted">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-current border-t-transparent mb-4" />
        <p className="text-lg">Cargando productos...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p className="text-lg">Error al cargar productos</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    )
  }

  // Empty state
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
