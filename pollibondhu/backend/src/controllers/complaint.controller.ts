import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Response } from 'express';
import { ComplaintService } from '../services/complaint.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';

const complaintService = new ComplaintService(prisma);

export async function submitComplaint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await complaintService.submitComplaint(req.body, req.user!.user_id);
    sendSuccess(res, result, 'Complaint submitted', 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function listComplaints(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const user_id = req.user!.role === 'ADMIN' ? undefined : req.user!.user_id;
    const result = await complaintService.listComplaints({ page, limit, status, user_id });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function updateComplaintStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const complaint_id = parseInt(req.params.id);
    const { status, notes } = req.body;
    const result = await complaintService.updateStatus(complaint_id, status, req.user!.user_id, notes);
    sendSuccess(res, result, 'Complaint status updated');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}
