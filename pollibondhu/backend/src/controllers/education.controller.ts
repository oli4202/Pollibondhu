import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Response } from 'express';
import { EducationService } from '../services/education.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';

const educationService = new EducationService(prisma);

export async function listInstitutions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const district = req.query.district as string;
    const search = req.query.search as string;
    const result = await educationService.listInstitutions({ page, limit, type, district, search });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function getInstitution(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const institution_id = parseInt(req.params.id);
    const result = await educationService.getInstitution(institution_id);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 404);
  }
}

export async function createInstitution(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await educationService.createInstitution(req.body);
    sendSuccess(res, result, 'Institution created', 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function updateInstitution(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const institution_id = parseInt(req.params.id);
    const result = await educationService.updateInstitution(institution_id, req.body);
    sendSuccess(res, result, 'Institution updated');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function listCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const institution_id = parseInt(req.params.institutionId);
    const result = await educationService.listCourses(institution_id);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const institution_id = parseInt(req.params.institutionId);
    const result = await educationService.createCourse({ ...req.body, institution_id });
    sendSuccess(res, result, 'Course created', 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function enrollStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const course_id = parseInt(req.params.courseId);
    const user_id = req.user!.user_id;
    const result = await educationService.enrollStudent(course_id, user_id);
    sendSuccess(res, result, 'Enrolled successfully');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function listAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const institution_id = parseInt(req.params.institutionId);
    const result = await educationService.listAnnouncements(institution_id);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}
