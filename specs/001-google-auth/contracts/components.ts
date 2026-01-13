/**
 * Component Contracts
 * Feature: 001-google-auth
 *
 * This contract defines the props interfaces for authentication components.
 */

import { AuthUser, AuthError } from './auth-context';

// ============================================================================
// LoginButton Component
// ============================================================================

/**
 * Props for the LoginButton component
 * Renders a "Sign in with Google" button
 */
export interface LoginButtonProps {
  /**
   * Called when user clicks the sign-in button
   */
  onClick: () => void;

  /**
   * Whether sign-in is currently in progress
   */
  loading?: boolean;

  /**
   * Whether the button should be disabled
   */
  disabled?: boolean;

  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

// ============================================================================
// UserMenu Component
// ============================================================================

/**
 * Props for the UserMenu component
 * Displays user info and sign-out option
 */
export interface UserMenuProps {
  /**
   * The authenticated user to display
   */
  user: AuthUser;

  /**
   * Called when user clicks sign out
   */
  onSignOut: () => void;

  /**
   * Whether sign-out is in progress
   */
  loading?: boolean;

  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

// ============================================================================
// AuthError Component
// ============================================================================

/**
 * Props for the AuthError component
 * Displays authentication error messages
 */
export interface AuthErrorDisplayProps {
  /**
   * The error to display
   */
  error: AuthError;

  /**
   * Called when user dismisses the error
   */
  onDismiss: () => void;

  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

// ============================================================================
// ProtectedRoute Component
// ============================================================================

/**
 * Props for the ProtectedRoute wrapper component
 * Redirects unauthenticated users to login
 */
export interface ProtectedRouteProps {
  /**
   * Child components to render when authenticated
   */
  children: React.ReactNode;

  /**
   * Optional custom loading component
   * Defaults to a spinner
   */
  loadingComponent?: React.ReactNode;

  /**
   * Path to redirect to when not authenticated
   * Defaults to '/login'
   */
  redirectTo?: string;
}

// ============================================================================
// LoginPage Component
// ============================================================================

/**
 * Props for the LoginPage component
 * Full-page login screen
 */
export interface LoginPageProps {
  /**
   * Optional path to redirect to after successful login
   * Defaults to '/'
   */
  redirectAfterLogin?: string;
}
