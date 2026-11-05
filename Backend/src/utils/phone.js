import { parsePhoneNumberWithError } from 'libphonenumber-js';

/**
 * Normalizes phone numbers to standard E.164 format.
 * Defaults to 'IN' (+91) if country code is not explicitly present.
 */
export function normalizePhoneNumber(rawPhone, defaultCountry = 'IN') {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Phone number must be a non-empty string');
  }

  const cleaned = rawPhone.trim();

  try {
    const phoneNumber = parsePhoneNumberWithError(cleaned, defaultCountry);
    if (!phoneNumber.isValid()) {
      throw new Error(`Invalid phone number: ${rawPhone}`);
    }
    return phoneNumber.format('E.164');
  } catch (error) {
    throw new Error(`Failed to parse phone number "${rawPhone}": ${error.message}`);
  }
}

