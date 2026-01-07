'use client'

import { FilterType, FILTER_LABELS } from '@/types/product'

interface FilterBarProps {
  currentFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts: {
    all: number
    pending: number
    missing: number
  }
}

export function FilterBar({
  currentFilter,
  onFilterChange,
  counts
}: FilterBarProps) {
  const filters: { type: FilterType; count: number }[] = [
    { type: 'ALL', count: counts.all },
    { type: 'PENDING', count: counts.pending },
    { type: 'MISSING', count: counts.missing }
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ type, count }) => (
        <button
          key={type}
          onClick={() => onFilterChange(type)}
          className={`
            px-4 py-2 min-h-[44px] rounded-lg
            font-medium text-sm
            transition-colors duration-200
            ${currentFilter === type
              ? 'bg-primary text-white'
              : 'bg-card-bg border border-card-border hover:bg-card-border'
            }
          `}
          aria-pressed={currentFilter === type}
        >
          {FILTER_LABELS[type]} ({count})
        </button>
      ))}
    </div>
  )
}
