'use client'

import { ProductState } from '@/types/product'

interface ProductRowProps {
  product: ProductState
  onToggleHay: (id: string) => void
  onToggleComprado: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
}

export function ProductRow({
  product,
  onToggleHay,
  onToggleComprado,
  onUpdateQuantity
}: ProductRowProps) {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      onUpdateQuantity(product.id, 0)
      return
    }
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue)) {
      onUpdateQuantity(product.id, numValue)
    }
  }

  const isInactive = product.hay

  return (
    <div
      className={`
        grid grid-cols-1 md:grid-cols-[1fr_80px_60px_60px]
        gap-2 md:gap-4
        p-4 md:p-3
        bg-card-bg border border-card-border rounded-lg md:rounded-none md:border-x-0 md:border-t-0
        ${isInactive ? 'opacity-50' : ''}
        transition-opacity duration-200
      `}
    >
      {/* Product Name */}
      <div className="flex items-center min-h-[44px]">
        {product.url ? (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              text-primary hover:text-primary-hover hover:underline
              transition-colors duration-200
              ${isInactive ? 'line-through' : ''}
            `}
          >
            {product.name}
          </a>
        ) : (
          <span className={isInactive ? 'line-through text-muted' : ''}>
            {product.name}
          </span>
        )}
      </div>

      {/* Mobile labels + controls container */}
      <div className="flex items-center justify-between md:contents gap-4">
        {/* Quantity */}
        <div className="flex items-center gap-2 md:justify-center">
          <span className="text-sm text-muted md:hidden">Cantidad:</span>
          <input
            type="number"
            min="0"
            max="99"
            value={product.quantity || ''}
            onChange={handleQuantityChange}
            className="
              w-16 h-[44px] md:h-10
              text-center
              bg-input-bg border border-input-border rounded
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              transition-colors duration-200
            "
            aria-label={`Cantidad de ${product.name}`}
          />
        </div>

        {/* Hay checkbox */}
        <label className="checkbox-wrapper cursor-pointer flex items-center gap-2">
          <span className="text-sm text-muted md:hidden">Hay</span>
          <input
            type="checkbox"
            checked={product.hay}
            onChange={() => onToggleHay(product.id)}
            className="
              w-5 h-5
              accent-success
              cursor-pointer
            "
            aria-label={`Marcar ${product.name} como que ya hay`}
          />
        </label>

        {/* Comprado checkbox */}
        <label className="checkbox-wrapper cursor-pointer flex items-center gap-2">
          <span className="text-sm text-muted md:hidden">Comprado</span>
          <input
            type="checkbox"
            checked={product.comprado}
            onChange={() => onToggleComprado(product.id)}
            className="
              w-5 h-5
              accent-primary
              cursor-pointer
            "
            aria-label={`Marcar ${product.name} como comprado`}
          />
        </label>
      </div>
    </div>
  )
}
