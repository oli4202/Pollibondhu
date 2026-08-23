import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ServiceService } from '../services/service.service';
import { SearchContext } from '../patterns/strategy/SearchStrategy';
import { ServiceSearchStrategy } from '../patterns/strategy/SearchStrategy';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';

const serviceService = new ServiceService(prisma);

export async function createService(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await serviceService.createService(req.body, req.user!.user_id);
    sendSuccess(res, result, 'Service created and pending approval', 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function listServices(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const provider_id = req.query.provider_id ? parseInt(req.query.provider_id as string) : undefined;

    // Public search uses Strategy pattern
    if (req.query.query || req.query.location) {
      const context = new SearchContext(new ServiceSearchStrategy());
      const result = await context.execute({
        query: req.query.query as string,
        location: req.query.location as string,
        category: req.query.category as string,
        page,
        limit,
      }, prisma);
      sendSuccess(res, result);
      return;
    }

    const result = await serviceService.listServices({ page, limit, status, provider_id });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function getService(req: Request, res: Response): Promise<void> {
  try {
    const service_id = parseInt(req.params.id);
    const result = await serviceService.getServiceDetails(service_id);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 404);
  }
}

export async function updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const service_id = parseInt(req.params.id);
    const result = await serviceService.updateService(service_id, req.body, req.user!.user_id, req.user!.role);
    sendSuccess(res, result, 'Service updated');
  } catch (err: any) {
    sendError(res, err.message, 403);
  }
}

export async function deleteService(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const service_id = parseInt(req.params.id);
    await serviceService.deleteService(service_id, req.user!.user_id, req.user!.role);
    sendSuccess(res, null, 'Service deleted');
  } catch (err: any) {
    sendError(res, err.message, 403);
  }
}

export async function approveService(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const service_id = parseInt(req.params.id);
    const result = await serviceService.approveService(service_id, req.user!.user_id);
    sendSuccess(res, result, 'Service approved');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}
