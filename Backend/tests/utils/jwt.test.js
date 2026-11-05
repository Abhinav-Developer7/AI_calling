import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '../../src/utils/jwt.js';

describe('JWT Utility', () => {
  it('should generate a valid JWT and decode its payload', () => {
    const payload = { id: '65b1234567890abcdef12345', role: 'admin' };
    const token = generateToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.exp).toBeDefined();
  });

  it('should fail verification if token is invalid or tampered with', () => {
    expect(() => {
      verifyToken('invalid.token.signature');
    }).toThrow();
  });
});

