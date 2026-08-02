'use client'

import { useState } from 'react'
import { ProductState } from '@/types/product'

interface MasonlineButtonProps {
  products: ProductState[]
  onMarkComprado: (id: string) => void
}

type CartStatus = 'idle' | 'loading' | 'success' | 'error'

interface ResultItem {
  id: string
  name: string
}

interface Result {
  success: ResultItem[]
  failed: { id: string; name: string; error: string }[]
}

export function MasonlineButton({ products, onMarkComprado }: MasonlineButtonProps) {
  const [loginLoading, setLoginLoading] = useState(false)
  const [cartStatus, setCartStatus] = useState<CartStatus>('idle')
  const [result, setResult] = useState<Result | null>(null)

  const eligible = products.filter(
    p => !p.hay && !p.comprado && p.quantity > 0 && p.url
  )

  const handleLogin = async () => {
    setLoginLoading(true)
    try {
      await fetch('/api/masonline/login', { method: 'POST' })
    } catch {
      // Browser opened is enough, ignore network errors
    } finally {
      setLoginLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (eligible.length === 0) return

    setCartStatus('loading')
    setResult(null)

    try {
      const response = await fetch('/api/masonline/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: eligible.map(p => ({
            id: p.id,
            name: p.name,
            url: p.url,
            quantity: p.quantity
          }))
        })
      })

      const data: Result = await response.json()

      if (!response.ok) {
        setCartStatus('error')
        setResult({ success: [], failed: [{ id: '', name: 'General', error: (data as unknown as { error: string }).error }] })
        return
      }

      setResult(data)
      setCartStatus(data.failed.length === 0 ? 'success' : 'error')

      // Mark successful products as comprado
      for (const item of data.success) {
        onMarkComprado(item.id)
      }
    } catch (error) {
      setCartStatus('error')
      setResult({
        success: [],
        failed: [{ id: '', name: 'General', error: error instanceof Error ? error.message : 'Error de red' }]
      })
    }
  }

  const cartButtonText = () => {
    switch (cartStatus) {
      case 'loading':
        return 'Agregando...'
      case 'success':
        return `Listo (${result?.success.length ?? 0})`
      case 'error':
        return result
          ? `${result.success.length} ok, ${result.failed.length} fallidos`
          : 'Error'
      default:
        return `Comprar (${eligible.length})`
    }
  }

  const cartDisabled = eligible.length === 0 || cartStatus === 'loading'
  const anyLoading = loginLoading || cartStatus === 'loading'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={handleLogin}
          disabled={anyLoading}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            anyLoading
              ? 'border-card-border bg-card-bg text-muted/50 cursor-not-allowed'
              : 'border-card-border bg-card-bg hover:bg-orange-900/30 hover:border-orange-700/50 text-muted hover:text-orange-400'
          }`}
          title="Abrir MasonLine para iniciar sesion"
        >
          {loginLoading && (
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle" />
          )}
          Sesion
        </button>

        <button
          onClick={handleAddToCart}
          disabled={cartDisabled || anyLoading}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            cartDisabled || anyLoading
              ? 'border-card-border bg-card-bg text-muted/50 cursor-not-allowed'
              : cartStatus === 'success'
                ? 'border-green-700/50 bg-green-900/30 text-green-400'
                : cartStatus === 'error'
                  ? 'border-red-700/50 bg-red-900/30 text-red-400'
                  : 'border-card-border bg-card-bg hover:bg-blue-900/30 hover:border-blue-700/50 text-muted hover:text-blue-400'
          }`}
          title={
            eligible.length === 0
              ? 'No hay productos pendientes con URL'
              : `Agregar ${eligible.length} productos al carrito de MasonLine`
          }
        >
          {cartStatus === 'loading' && (
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle" />
          )}
          {cartButtonText()}
        </button>
      </div>

      {result && result.failed.length > 0 && cartStatus !== 'loading' && (
        <div className="text-xs text-red-400 mt-1">
          {result.failed.map((f, i) => (
            <div key={i}>{f.name}: {f.error}</div>
          ))}
        </div>
      )}
    </div>
  )
}
