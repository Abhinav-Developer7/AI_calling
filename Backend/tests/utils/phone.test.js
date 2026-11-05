import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber } from '../../src/utils/phone.js';

describe('Phone Normalization Utility', () => {
  it('should normalize standard 10-digit Indian numbers to E.164 (+91)', () => {
    const input = '9876543210';
    const normalized = normalizePhoneNumber(input);
    expect(normalized).toBe('+919876543210');
  });

  it('should preserve already formatted +91 numbers', () => {
    const input = '+91 98765 43210';
    const normalized = normalizePhoneNumber(input);
    expect(normalized).toBe('+919876543210');
  });

  it('should handle Indian numbers with leading 0', () => {
    const input = '09876543210';
    const normalized = normalizePhoneNumber(input);
    expect(normalized).toBe('+919876543210');
  });

  it('should throw an error for invalid numbers', () => {
    expect(() => normalizePhoneNumber('123')).toThrow();
    expect(() => normalizePhoneNumber('abcdefghij')).toThrow();
    expect(() => normalizePhoneNumber('')).toThrow();
  });
});

