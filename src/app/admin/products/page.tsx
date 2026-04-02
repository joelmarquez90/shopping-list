'use client'

import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useProductMutations } from '@/hooks/useProductMutations'
import { ProductTable } from '@/components/admin/ProductTable'
import { ProductForm } from '@/components/admin/ProductForm'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { Product, CreateProductInput, UpdateProductInput } from '@/types/product'

export default function AdminProductsPage() {
  const { products, loading: productsLoading, error: productsError, refetch } = useProducts()
  const { create, update, remove, loading: mutationLoading, error: mutationError } = useProductMutations()

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')

  const handleCreate = async (data: CreateProductInput | UpdateProductInput) => {
    const result = await create(data as CreateProductInput)
    if (result.success) {
      setIsCreating(false)
      await refetch()
    }
  }

  const handleUpdate = async (data: CreateProductInput | UpdateProductInput) => {
    if (!editingProduct) return
    const result = await update(editingProduct.id, data as UpdateProductInput)
    if (result.success) {
      setEditingProduct(null)
      await refetch()
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    const result = await remove(deletingProduct.id)
    if (result.success) {
      setDeletingProduct(null)
      await refetch()
    }
  }

  const isFormOpen = isCreating || !!editingProduct

  const filteredProducts = search.trim()
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted text-sm mt-1">
            {filteredProducts.length} productos en el catálogo
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
        >
          Agregar Producto
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 rounded border border-card-border bg-card-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Error state */}
      {(productsError || mutationError) && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {productsError || mutationError}
        </div>
      )}

      {/* Form modal (create or edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!mutationLoading) {
                setIsCreating(false)
                setEditingProduct(null)
              }
            }}
          />
          <div className="relative bg-card-bg border border-card-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
            <ProductForm
              product={editingProduct}
              onSubmit={editingProduct ? handleUpdate : handleCreate}
              onCancel={() => {
                setIsCreating(false)
                setEditingProduct(null)
              }}
              loading={mutationLoading}
            />
          </div>
        </div>
      )}

      {/* Products table */}
      {productsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4" />
          <p className="text-muted">Cargando productos...</p>
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-lg">
          <ProductTable
            products={filteredProducts}
            onEdit={setEditingProduct}
            onDelete={setDeletingProduct}
            loading={mutationLoading}
          />
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingProduct && (
        <ConfirmDialog
          title="Eliminar producto"
          message={`¿Estás seguro de que quieres eliminar "${deletingProduct.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={handleDelete}
          onCancel={() => setDeletingProduct(null)}
          loading={mutationLoading}
          destructive
        />
      )}
    </div>
  )
}
