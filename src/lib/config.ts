/**
 * Application configuration
 */

/**
 * Get the base URL for the application
 * @returns The base URL, defaulting to 'https://secret-shards.de' if not set
 */
export function getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://secret-shards.de';
}

/**
 * Check if legal pages (Legal Disclosure and Privacy Policy) are enabled
 * @returns true if legal pages should be shown, false otherwise
 */
export function isLegalPagesEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_LEGAL_PAGES === 'true';
}
