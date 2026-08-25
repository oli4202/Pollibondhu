import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Response } from 'express';
import { ApplicationService } from '../services/application.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';

const applicationService = new ApplicationService(prisma);

export async function submitApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await applicationService.submitApplication(req.body, req.user!.user_id);
    sendSuccess(res, result, 'Application submitted successfully', 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function getApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const application_id = parseInt(req.params.id);
    const result = await applicationService.getApplication(application_id);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 404);
  }
}

export async function getApplicationByTracking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const tracking_id = req.params.trackingId;
    const result = await applicationService.getApplicationByTrackingId(tracking_id);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 404);
  }
}

export async function listApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const service_id = req.query.service_id ? parseInt(req.query.service_id as string) : undefined;

    // Scoping: citizens see only their own applications
    const isCitizen = req.user!.roles.includes('CITIZEN') || req.user!.role === 'USER';
    const user_id = isCitizen ? req.user!.user_id : undefined;

    const result = await applicationService.listApplications({ page, limit, status, user_id, service_id });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function processApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const application_id = parseInt(req.params.id);
    const { status, notes, rejection_reason } = req.body;
    const result = await applicationService.processApplication(
      application_id, status, req.user!.user_id, notes, rejection_reason
    );
    sendSuccess(res, result, 'Application updated');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const application_id = parseInt(req.params.id);
    const { doc_type, file_name, file_url, file_size, mime_type } = req.body;
    const result = await applicationService.uploadDocument(
      application_id, req.user!.user_id,
      { doc_type, file_name, file_url, file_size, mime_type }
    );
    sendSuccess(res, result, 'Document uploaded', 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function getTimeline(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const application_id = parseInt(req.params.id);
    const result = await applicationService.getTimeline(application_id);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function provideFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const application_id = parseInt(req.params.id);
    const { rating, feedback } = req.body;
    const result = await applicationService.provideFeedback(
      application_id, req.user!.user_id, rating, feedback
    );
    sendSuccess(res, result, 'Feedback submitted');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}
