'use client'

import { useState } from 'react'
import type { Product, CreateProductInput, UpdateProductInput } from '@/types/product'

interface ProductFormProps {
  product?: Product | null
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

/**
 * Internal form component that initializes state from props
 */
function ProductFormInternal({
  product,
  onSubmit,
  onCancel,
  loading = false
}: ProductFormProps) {
  // Initialize state from product prop (only on mount due to key prop)
  const [name, setName] = useState(product?.name || '')
  const [url, setUrl] = useState(product?.url || '')
  const [defaultQuantity, setDefaultQuantity] = useState(product?.defaultQuantity || 0)
  const [defaultHay, setDefaultHay] = useState(product?.defaultHay ?? false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!product

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError('El nombre del producto es requerido')
      return
    }

    if (name.length > 100) {
      setError('El nombre es demasiado largo (máximo 100 caracteres)')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        url: url.trim() || undefined,
        defaultQuantity,
        defaultHay
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Nombre *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-card-bg border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Nombre del producto"
          disabled={loading}
          required
        />
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-1">
          URL (opcional)
        </label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 bg-card-bg border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://..."
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="defaultQuantity" className="block text-sm font-medium mb-1">
            Cantidad por defecto
          </label>
          <input
            type="number"
            id="defaultQuantity"
            value={defaultQuantity}
            onChange={(e) => setDefaultQuantity(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 bg-card-bg border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            min="0"
            disabled={loading}
          />
        </div>

        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            id="defaultHay"
            checked={defaultHay}
            onChange={(e) => setDefaultHay(e.target.checked)}
            className="w-5 h-5 rounded border-card-border text-primary focus:ring-primary"
            disabled={loading}
          />
          <label htmlFor="defaultHay" className="ml-2 text-sm">
            Hay por defecto
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-card-border rounded hover:bg-card-bg/50 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

/**
 * Form for creating or editing a product.
 * Uses key prop pattern to reset form state when product changes.
 */
export function ProductForm(props: ProductFormProps) {
  // Use product id as key to force remount when switching products
  // This avoids useEffect setState issues and provides cleaner state reset
  const key = props.product?.id || 'new'
  return <ProductFormInternal key={key} {...props} />
}
