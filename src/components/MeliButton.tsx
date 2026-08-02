'use client'

import { useState } from 'react'
import { ProductState } from '@/types/product'
import { MeliCartResult, MeliSearchItem, MeliSelection } from '@/types/meli'
import { MeliCartModal } from '@/components/MeliCartModal'

interface MeliButtonProps {
  products: ProductState[]
  onMarkComprado: (id: string) => void
}

type MeliStatus = 'idle' | 'searching' | 'selecting' | 'adding' | 'success' | 'error'

/**
 * Builds a Mercado Libre cart with whatever is still missing after the
 * MasOnline run: no "hay", not bought yet, and with a quantity to buy.
 * Unlike MasOnline it does not need a stored URL, it searches by name.
 */
export function MeliButton({ products, onMarkComprado }: MeliButtonProps) {
  const [status, setStatus] = useState<MeliStatus>('idle')
  const [items, setItems] = useState<MeliSearchItem[]>([])
  const [result, setResult] = useState<MeliCartResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const eligible = products.filter(p => !p.hay && !p.comprado && p.quantity > 0)

  const handleSearch = async () => {
    if (eligible.length === 0) return

    setStatus('searching')
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/meli/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: eligible.map(p => ({ id: p.id, name: p.name, quantity: p.quantity }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setError(data.error || 'Error buscando en Mercado Libre')
        return
      }

      setItems(data.items)
      setStatus('selecting')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error de red')
    }
  }

  const handleConfirm = async (selections: MeliSelection[]) => {
    setStatus('adding')

    try {
      const response = await fetch('/api/meli/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections })
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setError(data.error || 'Error agregando al carrito')
        return
      }

      const cartResult: MeliCartResult = data
      setResult(cartResult)
      setItems([])
      setStatus(cartResult.failed.length === 0 ? 'success' : 'error')

      for (const item of cartResult.success) {
        onMarkComprado(item.id)
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error de red')
    }
  }

  const handleCancel = () => {
    setItems([])
    setStatus('idle')
  }

  const buttonText = () => {
    switch (status) {
      case 'searching':
        return 'Buscando...'
      case 'selecting':
      case 'adding':
        return 'Agregando...'
      case 'success':
        return `Listo (${result?.success.length ?? 0})`
      case 'error':
        return result
          ? `${result.success.length} ok, ${result.failed.length} fallidos`
          : 'Error'
      default:
        return `Mercado Libre (${eligible.length})`
    }
  }

  const busy = status === 'searching' || status === 'adding'
  const disabled = eligible.length === 0 || busy

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleSearch}
        disabled={disabled}
        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
          disabled
            ? 'border-card-border bg-card-bg text-muted/50 cursor-not-allowed'
            : status === 'success'
              ? 'border-green-700/50 bg-green-900/30 text-green-400'
              : status === 'error'
                ? 'border-red-700/50 bg-red-900/30 text-red-400'
                : 'border-card-border bg-card-bg hover:bg-yellow-900/30 hover:border-yellow-700/50 text-muted hover:text-yellow-400'
        }`}
        title={
          eligible.length === 0
            ? 'No hay productos faltantes'
            : `Buscar ${eligible.length} faltantes en Mercado Libre`
        }
      >
        {busy && (
          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle" />
        )}
        {buttonText()}
      </button>

      {error && status === 'error' && (
        <div className="text-xs text-red-400 mt-1">{error}</div>
      )}

      {result && result.failed.length > 0 && !busy && (
        <div className="text-xs text-red-400 mt-1">
          {result.failed.map((f, i) => (
            <div key={i}>{f.name}: {f.error}</div>
          ))}
        </div>
      )}

      {(status === 'selecting' || status === 'adding') && items.length > 0 && (
        <MeliCartModal
          items={items}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={status === 'adding'}
        />
      )}
    </div>
  )
}
