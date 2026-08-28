/**
 * Unit tests — ServiceController
 * Uses jest.spyOn on ServiceService.prototype to intercept the module-level singleton.
 * SearchContext is mocked to test the strategy branch.
 */
import { Request, Response } from 'express';
import { ServiceService } from '../../../src/services/service.service';
import * as SearchStrategyModule from '../../../src/patterns/strategy/SearchStrategy';

import {
  createService, listServices, listMyServices,
  getService, updateService, deleteService, approveService,
} from '../../../src/controllers/service.controller';

const mockService = {
  service_id: 1,
  title: 'Tractor Rental',
  status: 'APPROVED',
  provider_id: 5,
};

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockAuthReq = (overrides: Record<string, any> = {}): any => ({
  user: { user_id: 5, role: 'SERVICE_PROVIDER', roles: ['SERVICE_PROVIDER'] },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

describe('ServiceController', () => {
  // ─── createService ────────────────────────────────────────────────────────────

  describe('createService', () => {
    it('returns 201 on successful creation', async () => {
      jest.spyOn(ServiceService.prototype, 'createService').mockResolvedValue(mockService as any);
      const req = mockAuthReq({ body: { title: 'Tractor Rental' } });
      const res = mockRes();

      await createService(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 400 when service layer throws', async () => {
      jest.spyOn(ServiceService.prototype, 'createService').mockRejectedValue(new Error('Category unavailable'));
      const req = mockAuthReq({ body: { title: 'Bad' } });
      const res = mockRes();

      await createService(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── listServices ─────────────────────────────────────────────────────────────

  describe('listServices', () => {
    it('uses Strategy pattern when query param is given', async () => {
      const executeMock = jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
      jest.spyOn(SearchStrategyModule, 'SearchContext').mockImplementation(() => ({ execute: executeMock }) as any);
      const req: any = { query: { query: 'tractor', page: '1', limit: '10' } };
      const res = mockRes();

      await listServices(req, res);

      expect(executeMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('uses Strategy pattern when location param is given', async () => {
      const executeMock = jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
      jest.spyOn(SearchStrategyModule, 'SearchContext').mockImplementation(() => ({ execute: executeMock }) as any);
      const req: any = { query: { location: 'Dhaka', page: '1', limit: '10' } };
      const res = mockRes();

      await listServices(req, res);

      expect(executeMock).toHaveBeenCalled();
    });

    it('falls back to service.listServices for catalogue browse', async () => {
      const spy = jest.spyOn(ServiceService.prototype, 'listServices').mockResolvedValue({ data: [mockService], total: 1, page: 1, limit: 10 } as any);
      const req: any = { query: { page: '1', limit: '10' } };
      const res = mockRes();

      await listServices(req, res);

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ status: 'APPROVED' }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(ServiceService.prototype, 'listServices').mockRejectedValue(new Error('DB error'));
      const req: any = { query: {} };
      const res = mockRes();

      await listServices(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── listMyServices ──────────────────────────────────────────────────────────

  describe('listMyServices', () => {
    it('lists services scoped to authenticated user', async () => {
      const spy = jest.spyOn(ServiceService.prototype, 'listServices').mockResolvedValue({ data: [mockService], total: 1, page: 1, limit: 10 } as any);
      const req = mockAuthReq({ query: {} });
      const res = mockRes();

      await listMyServices(req, res);

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ provider_id: 5 }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(ServiceService.prototype, 'listServices').mockRejectedValue(new Error('fail'));
      const req = mockAuthReq({ query: {} });
      const res = mockRes();

      await listMyServices(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── getService ───────────────────────────────────────────────────────────────

  describe('getService', () => {
    it('returns the service on success', async () => {
      jest.spyOn(ServiceService.prototype, 'getServiceDetails').mockResolvedValue(mockService as any);
      const req: any = { params: { id: '1' }, query: {} };
      const res = mockRes();

      await getService(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 when service not found', async () => {
      jest.spyOn(ServiceService.prototype, 'getServiceDetails').mockRejectedValue(new Error('Service not found'));
      const req: any = { params: { id: '999' }, query: {} };
      const res = mockRes();

      await getService(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── updateService ────────────────────────────────────────────────────────────

  describe('updateService', () => {
    it('returns updated service', async () => {
      jest.spyOn(ServiceService.prototype, 'updateService').mockResolvedValue({ ...mockService, title: 'Updated' } as any);
      const req = mockAuthReq({ params: { id: '1' }, body: { title: 'Updated' } });
      const res = mockRes();

      await updateService(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Service updated' }));
    });

    it('returns 403 on unauthorized update', async () => {
      jest.spyOn(ServiceService.prototype, 'updateService').mockRejectedValue(new Error('Unauthorized'));
      const req = mockAuthReq({ params: { id: '1' }, body: {} });
      const res = mockRes();

      await updateService(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ─── deleteService ────────────────────────────────────────────────────────────

  describe('deleteService', () => {
    it('returns success message on deletion', async () => {
      jest.spyOn(ServiceService.prototype, 'deleteService').mockResolvedValue(undefined as any);
      const req = mockAuthReq({ params: { id: '1' } });
      const res = mockRes();

      await deleteService(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Service deleted' }));
    });

    it('returns 403 on unauthorized deletion', async () => {
      jest.spyOn(ServiceService.prototype, 'deleteService').mockRejectedValue(new Error('Unauthorized'));
      const req = mockAuthReq({ params: { id: '1' } });
      const res = mockRes();

      await deleteService(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ─── approveService ───────────────────────────────────────────────────────────

  describe('approveService', () => {
    it('returns approved service on success', async () => {
      jest.spyOn(ServiceService.prototype, 'approveService').mockResolvedValue({ ...mockService, status: 'APPROVED' } as any);
      const req = mockAuthReq({ params: { id: '1' }, user: { user_id: 1, role: 'ADMIN', roles: ['ADMIN'] } });
      const res = mockRes();

      await approveService(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Service approved' }));
    });

    it('returns 400 on failure', async () => {
      jest.spyOn(ServiceService.prototype, 'approveService').mockRejectedValue(new Error('Not found'));
      const req = mockAuthReq({ params: { id: '999' } });
      const res = mockRes();

      await approveService(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
