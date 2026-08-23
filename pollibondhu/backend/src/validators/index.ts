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
  title: z.string().min(3),
  description: z.string().optional(),
  price: z.number().optional(),
  location: z.string().optional(),
  district: z.string().optional(),
  category_id: z.number().optional(),
});

export const complaintSchema = z.object({
  category: z.string().min(1),
  subject: z.string().min(3),
  description: z.string().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED']),
  notes: z.string().optional(),
});
