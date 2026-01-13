'use client'

import { AuthError } from '@/types/auth'

interface AuthErrorDisplayProps {
  error: AuthError
  onDismiss: () => void
  className?: string
}

export function AuthErrorDisplay({
  error,
  onDismiss,
  className = '',
}: AuthErrorDisplayProps) {
  return (
    <div
      className={`
        bg-red-900/20 border border-red-500/50
        rounded-lg p-4
        text-left
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-red-400 font-medium mb-1">Error</p>
          <p className="text-red-300 text-sm">{error.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 p-1"
          aria-label="Dismiss error"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
