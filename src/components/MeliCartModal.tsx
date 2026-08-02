'use client'

import { useState } from 'react'
import { MeliCandidate, MeliSearchItem, MeliSelection } from '@/types/meli'

interface MeliCartModalProps {
  items: MeliSearchItem[]
  onConfirm: (selections: MeliSelection[]) => void
  onCancel: () => void
  loading: boolean
}

const SKIP = ''

/**
 * Significant words of a product name, used to preselect an obvious match.
 */
function keywords(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(word => word.length >= 4)
}

/**
 * Preselect the first candidate only when its title covers every significant
 * word of the product name. Anything less ambiguous is left to the user.
 */
function defaultSelection(item: MeliSearchItem): string {
  const first = item.candidates[0]
  if (!first) return SKIP

  const words = keywords(item.productName)
  if (words.length === 0) return SKIP

  const title = first.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return words.every(word => title.includes(word)) ? first.url : SKIP
}

function CandidateCard({
  candidate,
  selected,
  onSelect,
  disabled
}: {
  candidate: MeliCandidate
  selected: boolean
  onSelect: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex flex-col gap-2 w-40 shrink-0 p-2 rounded-lg border text-left transition-colors disabled:opacity-50 ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-card-border bg-card-bg hover:border-primary/50'
      }`}
    >
      {candidate.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={candidate.imageUrl}
          alt={candidate.title}
          className="w-full h-24 object-contain rounded bg-white/5"
        />
      ) : (
        <div className="w-full h-24 rounded bg-white/5" />
      )}
      <span className="text-xs leading-snug line-clamp-3">{candidate.title}</span>
      <span className="text-sm font-semibold">{candidate.price}</span>
      {candidate.seller && (
        <span className="text-[11px] text-muted line-clamp-1">{candidate.seller}</span>
      )}
    </button>
  )
}

/**
 * Lets the user confirm which Mercado Libre listing matches each missing
 * product before anything is added to the cart.
 */
export function MeliCartModal({ items, onConfirm, onCancel, loading }: MeliCartModalProps) {
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map(item => [item.productId, defaultSelection(item)]))
  )

  const selections: MeliSelection[] = items
    .filter(item => selected[item.productId])
    .map(item => ({
      productId: item.productId,
      productName: item.productName,
      url: selected[item.productId],
      quantity: item.quantity
    }))

  const withResults = items.filter(item => item.candidates.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={loading ? undefined : onCancel} />

      <div className="relative bg-card-bg border border-card-border rounded-lg max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col shadow-xl">
        <div className="p-6 pb-3 border-b border-card-border">
          <h2 className="text-lg font-semibold">Confirmar productos en Mercado Libre</h2>
          <p className="text-muted text-sm mt-1">
            Eleg&iacute; qu&eacute; publicaci&oacute;n corresponde a cada faltante. Todav&iacute;a no se agreg&oacute; nada al carrito.
          </p>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex flex-col gap-5">
          {items.map(item => (
            <div key={item.productId}>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-medium">{item.productName}</span>
                <span className="text-xs text-muted">x{item.quantity}</span>
              </div>

              {item.candidates.length === 0 ? (
                <p className="text-sm text-red-400">
                  {item.error || 'Sin resultados en Mercado Libre'}
                </p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {item.candidates.map(candidate => (
                    <CandidateCard
                      key={candidate.url}
                      candidate={candidate}
                      selected={selected[item.productId] === candidate.url}
                      onSelect={() => setSelected(prev => ({ ...prev, [item.productId]: candidate.url }))}
                      disabled={loading}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => setSelected(prev => ({ ...prev, [item.productId]: SKIP }))}
                    disabled={loading}
                    className={`w-24 shrink-0 p-2 rounded-lg border text-xs transition-colors disabled:opacity-50 ${
                      selected[item.productId] === SKIP
                        ? 'border-primary bg-primary/10'
                        : 'border-card-border bg-card-bg hover:border-primary/50 text-muted'
                    }`}
                  >
                    Omitir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 pt-3 border-t border-card-border flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {withResults.length} de {items.length} con resultados
          </span>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm border border-card-border rounded hover:bg-card-bg/50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(selections)}
              disabled={loading || selections.length === 0}
              className="px-4 py-2 text-sm text-white rounded bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Agregando...' : `Agregar ${selections.length} al carrito`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
