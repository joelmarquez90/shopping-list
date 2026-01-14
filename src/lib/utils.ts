/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @param maxLength - Maximum length of the slug (default 100)
 */
export function generateSlug(text: string, maxLength: number = 100): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, maxLength) // Limit length
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
