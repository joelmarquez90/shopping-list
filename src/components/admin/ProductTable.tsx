'use client'

import type { Product } from '@/types/product'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  loading?: boolean
}

/**
 * Admin table for viewing and managing products
 */
export function ProductTable({
  products,
  onEdit,
  onDelete,
  loading = false
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg">No hay productos</p>
        <p className="text-sm mt-2">Agrega un producto para comenzar</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border text-left">
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">URL</th>
            <th className="px-4 py-3 font-medium text-center w-20">Cant.</th>
            <th className="px-4 py-3 font-medium text-center w-16">Hay</th>
            <th className="px-4 py-3 font-medium text-right w-32">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b border-card-border hover:bg-card-bg/50 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-medium">{product.name}</span>
                <span className="block text-xs text-muted md:hidden truncate max-w-[200px]">
                  {product.url || 'Sin URL'}
                </span>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                {product.url ? (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate block max-w-[300px]"
                  >
                    {product.url}
                  </a>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">{product.defaultQuantity}</td>
              <td className="px-4 py-3 text-center">
                {product.defaultHay ? (
                  <span className="text-green-500">Si</span>
                ) : (
                  <span className="text-muted">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="px-3 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    className="px-3 py-1 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                    disabled={loading}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
