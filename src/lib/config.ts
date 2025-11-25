/**
 * Application configuration
 */

/**
 * Check if legal pages (Legal Disclosure and Privacy Policy) are enabled
 * @returns true if legal pages should be shown, false otherwise
 */
export function isLegalPagesEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_LEGAL_PAGES === 'true';
}
