'use client'

import Link from 'next/link'
import { AuthUser } from '@/types/auth'

interface UserMenuProps {
  user: AuthUser
  onSignOut: () => void
  loading?: boolean
  className?: string
  showAdminLink?: boolean
}

export function UserMenu({
  user,
  onSignOut,
  loading = false,
  className = '',
  showAdminLink = true,
}: UserMenuProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Admin Link */}
      {showAdminLink && (
        <Link
          href="/admin/products"
          className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          Admin
        </Link>
      )}

      {/* User Avatar */}
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'User avatar'}
          className="w-8 h-8 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-sm font-medium">
            {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* User Name (hidden on mobile) */}
      <span className="hidden sm:inline text-sm font-medium truncate max-w-[150px]">
        {user.displayName || user.email}
      </span>

      {/* Sign Out Button */}
      <button
        onClick={onSignOut}
        disabled={loading}
        className="
          px-3 py-1.5
          text-sm
          text-muted hover:text-foreground
          bg-card hover:bg-card-hover
          border border-card-border
          rounded-md
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          'Sign out'
        )}
      </button>
    </div>
  )
}
