import { describe, it, expect } from 'vitest';
import { maskPhoneNumber, maskObjectPII } from '../../src/utils/logger.js';

describe('PII Masking Utilities', () => {
  it('should mask phone numbers keeping only the first 3 and last 2 digits', () => {
    expect(maskPhoneNumber('+919876543210')).toBe('+91********10');
    expect(maskPhoneNumber('9876543210')).toBe('987*****10');
  });

  it('should mask PII inside nested objects for logging safety', () => {
    const rawData = {
      customerName: 'Ananya Nair',
      phoneNumber: '+919876543210',
      invoiceNumber: 'INV-2026-001',
      details: {
        phone: '9876543210',
        token: 'sensitive_jwt_token_here',
      },
    };

    const masked = maskObjectPII(rawData);

    expect(masked.customerName).toBe('Ananya Nair');
    expect(masked.phoneNumber).toBe('+91********10');
    expect(masked.invoiceNumber).toBe('INV-2026-001');
    expect(masked.details.phone).toBe('987*****10');
    expect(masked.details.token).toBe('***REDACTED***');
  });
});
