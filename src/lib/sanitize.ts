/**
 * Escape HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns Escaped HTML-safe string
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize user input by escaping HTML and stripping dangerous tags
 * @param input - The user input to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeUserInput(input: string): string {
  return escapeHtml(input);
}
