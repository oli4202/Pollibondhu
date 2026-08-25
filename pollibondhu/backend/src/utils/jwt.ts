import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { TokenPayload } from '../types';

// Read the runtime environment for every token operation. This keeps signing
// and verification aligned after a development-server reload.
const accessSecret = () => process.env.JWT_SECRET || config.jwtSecret;
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || config.jwtRefreshSecret;

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, accessSecret(), { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, refreshSecret(), { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, accessSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, refreshSecret()) as TokenPayload;
}
