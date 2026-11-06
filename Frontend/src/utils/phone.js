/**
 * Masks a phone number for PII privacy compliance (India DPDP Act).
 * Example: "+918086939423" -> "+91 80869•••23"
 * Example: "8086939423" -> "80869•••23"
 * @param {string} phone
 * @param {boolean} [reveal=false]
 * @returns {string}
 */
export function maskPhoneNumber(phone, reveal = false) {
  if (!phone || typeof phone !== 'string') return '—';
  if (reveal) return phone;

  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.length < 10) return cleaned;

  // If starts with +91 or 91
  if (cleaned.startsWith('+91') && cleaned.length >= 13) {
    const raw10 = cleaned.slice(3);
    return `+91 ${raw10.slice(0, 5)}•••${raw10.slice(-2)}`;
  }

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}•••${cleaned.slice(-2)}`;
  }

  // Generic masking
  return `${cleaned.slice(0, 4)}••••${cleaned.slice(-2)}`;
}

