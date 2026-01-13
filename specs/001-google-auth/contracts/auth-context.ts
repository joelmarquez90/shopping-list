/**
 * Auth Context Contract
 * Feature: 001-google-auth
 *
 * This contract defines the interface for the authentication context
 * that will be provided throughout the application.
 */

import { User } from 'firebase/auth';

// ============================================================================
// Types
// ============================================================================

/**
 * Subset of Firebase User containing fields used by the application
 */
export interface AuthUser {
  /** Firebase unique identifier */
  uid: string;
  /** User's email address */
  email: string;
  /** Display name from Google account */
  displayName: string | null;
  /** Profile photo URL from Google account */
  photoURL: string | null;
}

/**
 * Authentication error types
 */
export type AuthErrorType =
  | 'POPUP_CLOSED'
  | 'POPUP_BLOCKED'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

/**
 * Error information for authentication failures
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
}

// ============================================================================
// Context Value Contract
// ============================================================================

/**
 * The value provided by AuthContext to consuming components
 */
export interface AuthContextValue {
  /**
   * Currently authenticated user, or null if not signed in
   */
  user: AuthUser | null;

  /**
   * True while initial auth state is being determined
   * Also true during sign-in/sign-out operations
   */
  loading: boolean;

  /**
   * Error from the most recent auth operation, or null
   */
  error: AuthError | null;

  /**
   * Initiates Google Sign-In flow via popup
   * @throws AuthError if sign-in fails or email not in allowlist
   */
  signInWithGoogle: () => Promise<void>;

  /**
   * Signs out the current user
   */
  signOut: () => Promise<void>;

  /**
   * Clears the current error state
   */
  clearError: () => void;
}

// ============================================================================
// Hook Contract
// ============================================================================

/**
 * Hook to access authentication state and methods
 * Must be used within an AuthProvider
 *
 * @example
 * ```tsx
 * const { user, loading, signInWithGoogle, signOut } = useAuth();
 *
 * if (loading) return <Spinner />;
 * if (!user) return <LoginButton onClick={signInWithGoogle} />;
 * return <UserMenu user={user} onSignOut={signOut} />;
 * ```
 */
export type UseAuth = () => AuthContextValue;

// ============================================================================
// Error Messages Contract
// ============================================================================

/**
 * User-friendly error messages for each error type
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  POPUP_CLOSED: 'Sign-in was cancelled. Please try again.',
  POPUP_BLOCKED: 'Pop-up was blocked. Please allow pop-ups for this site.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'Access denied. This application is restricted to authorized users only.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

// ============================================================================
// Utility Type Guards
// ============================================================================

/**
 * Type guard to check if a Firebase User is an authorized AuthUser
 */
export function isAuthorizedUser(
  user: User | null,
  allowedEmails: string[]
): user is User & { email: string } {
  return user !== null &&
         user.email !== null &&
         allowedEmails.includes(user.email);
}

/**
 * Maps Firebase error codes to AuthErrorType
 */
export function mapFirebaseError(code: string): AuthErrorType {
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'POPUP_CLOSED';
    case 'auth/popup-blocked':
      return 'POPUP_BLOCKED';
    case 'auth/network-request-failed':
      return 'NETWORK_ERROR';
    default:
      return 'UNKNOWN';
  }
}
