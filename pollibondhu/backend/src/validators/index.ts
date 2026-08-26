import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['USER', 'PROVIDER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(2000),
  price: z.number().finite().min(0).optional(),
  location: z.string().trim().max(200).optional(),
  district: z.string().trim().max(100).optional(),
  category_id: z.number().int().positive().optional(),
  category: z.string().trim().min(2).max(100).optional(),
});

export const complaintSchema = z.object({
  category: z.string().trim().min(1).max(100),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED']),
  notes: z.string().trim().max(5000).optional(),
});
