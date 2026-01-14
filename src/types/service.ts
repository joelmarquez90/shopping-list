/**
 * Result type for service operations that can fail
 * Provides consistent error handling across all services
 */
export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Helper to create a successful result
 */
export function successResult<T>(data: T): ServiceResult<T> {
  return { success: true, data }
}

/**
 * Helper to create an error result
 */
export function errorResult<T>(error: string): ServiceResult<T> {
  return { success: false, error }
}
