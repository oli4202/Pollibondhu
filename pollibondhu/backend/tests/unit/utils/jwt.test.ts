/**
 * Unit tests — JWT utilities
 * Sign/verify roundtrips against the test secrets configured in setup.ts.
 */
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/utils/jwt';

const payload = { user_id: 5, email: 'karim@example.com', role: 'CITIZEN' } as any;

describe('JWT utilities', () => {
  it('round-trips an access token', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token) as any;
    expect(decoded).toMatchObject(payload);
    expect(decoded.exp! - decoded.iat!).toBe(2 * 60 * 60); // 2 hours
  });

  it('round-trips a refresh token with a longer lifetime', () => {
    const token = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(token) as any;
    expect(decoded).toMatchObject(payload);
    expect(decoded.exp! - decoded.iat!).toBe(7 * 24 * 60 * 60); // 7 days
  });

  it('rejects access tokens verified with the refresh secret', () => {
    const token = generateAccessToken(payload);
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it('rejects tampered tokens', () => {
    const token = generateAccessToken(payload);
    const parts = token.split('.');
    parts[2] = parts[2].slice(0, -2) + 'xx';
    expect(() => verifyAccessToken(parts.join('.'))).toThrow();
  });
});
