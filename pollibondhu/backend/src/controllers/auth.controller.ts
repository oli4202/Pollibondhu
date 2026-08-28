import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';

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
