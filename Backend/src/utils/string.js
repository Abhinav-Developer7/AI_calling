/**
 * Formats a string to proper Title Case.
 * Example: "abhinav k" -> "Abhinav K", "MARY JOHN" -> "Mary John"
 * @param {string} str
 * @returns {string}
 */
export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

