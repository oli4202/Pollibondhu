import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt';

const authService = new AuthService(prisma);

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'User registered successfully', 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result, 'Login successful');
  } catch (err: any) {
    sendError(res, err.message, 401);
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) { sendError(res, 'Email is required', 400); return; }
    const result = await authService.forgotPassword(email);
    sendSuccess(res, result, 'Password reset initiated');
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) { sendError(res, 'All fields are required', 400); return; }
    if (newPassword.length < 6) { sendError(res, 'Password must be at least 6 characters', 400); return; }
    const result = await authService.resetPassword(email, otp, newPassword);
    sendSuccess(res, result, 'Password reset successful');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

/**
 * POST /auth/refresh
 * Uses the stored refreshToken (7-day expiry) to silently issue a new accessToken (15-min).
 * Called automatically by the frontend API interceptor on 401 responses.
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (!token) { sendError(res, 'Refresh token required', 400); return; }
    const payload = verifyRefreshToken(token);
    const newAccessToken = generateAccessToken({ 
      user_id: payload.user_id, 
      email: payload.email, 
      role: payload.role 
    });
    sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch {
    sendError(res, 'Session expired. Please log in again.', 401);
  }
}
