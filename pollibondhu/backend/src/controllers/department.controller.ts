import { Request, Response } from 'express';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { sendSuccess, sendError } from '../utils/apiResponse';

export async function adminListDepartments(req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true,
            applications: true,
            projects: true
          }
        }
      }
    });
    sendSuccess(res, departments);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}

export async function adminCreateDepartment(req: Request, res: Response) {
  try {
    const { name, description } = req.body;
    if (!name) return sendError(res, 'Name is required', 400);

    const department = await prisma.department.create({
      data: { name, description, is_active: true }
    });
    sendSuccess(res, department, 'Department created', 201);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}
