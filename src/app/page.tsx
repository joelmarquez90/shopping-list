'use client'

import { useProductState } from '@/hooks/useProductState'
import { products as initialProducts } from '@/data/products'
import { ProductList } from '@/components/ProductList'
import { FilterBar } from '@/components/FilterBar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { UserMenu } from '@/components/auth/UserMenu'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, signOut, loading: authLoading } = useAuth()
  const {
    products,
    filter,
    setFilter,
    toggleHay,
    toggleComprado,
    updateQuantity,
    counts
  } = useProductState(initialProducts)

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
        <FilterBar
          currentFilter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        {/* Product List */}
        <section className="mt-6">
          <ProductList
            products={products}
            onToggleHay={toggleHay}
            onToggleComprado={toggleComprado}
            onUpdateQuantity={updateQuantity}
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
