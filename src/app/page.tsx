'use client'

import { useProductState } from '@/hooks/useProductState'
import { useProducts } from '@/hooks/useProducts'
import { ProductList } from '@/components/ProductList'
import { FilterBar } from '@/components/FilterBar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { UserMenu } from '@/components/auth/UserMenu'
import { MasonlineButton } from '@/components/MasonlineButton'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, signOut, loading: authLoading } = useAuth()
  const { products: firestoreProducts, loading: productsLoading, error: productsError } = useProducts()
  const {
    products,
    allProducts,
    filter,
    setFilter,
    toggleHay,
    toggleComprado,
    updateQuantity,
    resetAll,
    counts,
    loading: stateLoading
  } = useProductState(firestoreProducts, { userId: user?.uid ?? null })

  return (
    <ProtectedRoute>
      <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Lista de Compras
              </h1>
              <p className="text-muted text-sm md:text-base">
                Gestiona tu lista de compras mensual
              </p>
            </div>
            {user && (
              <UserMenu
                user={user}
                onSignOut={signOut}
                loading={authLoading}
              />
            )}
          </div>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <FilterBar
            currentFilter={filter}
            onFilterChange={setFilter}
            counts={counts}
          />
          <div className="flex items-center gap-2">
            <MasonlineButton products={allProducts} onMarkComprado={toggleComprado} />
            <button
              onClick={resetAll}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-card-border bg-card-bg hover:bg-red-900/30 hover:border-red-700/50 text-muted hover:text-red-400 transition-colors"
              title="Limpiar todos los checks y cantidades"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Product List */}
        <section className="mt-6">
          <ProductList
            products={products}
            onToggleHay={toggleHay}
            onToggleComprado={toggleComprado}
            onUpdateQuantity={updateQuantity}
            loading={productsLoading || stateLoading}
            error={productsError}
          />
        </section>

        {/* Footer with stats */}
        <footer className="mt-8 pt-4 border-t border-card-border text-sm text-muted text-center">
          <p>
            Mostrando {products.length} de {counts.all} productos
          </p>
        </footer>
      </main>
    </ProtectedRoute>
  )
}
