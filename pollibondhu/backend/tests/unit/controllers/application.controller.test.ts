/**
 * Unit tests — ApplicationController
 * Uses jest.spyOn on ApplicationService.prototype to intercept the module-level singleton.
 */
import { Response } from 'express';
import { ApplicationService } from '../../../src/services/application.service';

import {
  submitApplication, getApplication, getApplicationByTracking,
  listApplications, processApplication, uploadDocument,
  getTimeline, provideFeedback, resubmitApplication,
} from '../../../src/controllers/application.controller';

const mockApp = {
  application_id: 1,
  tracking_id: 'APP-2026-0001',
  user_id: 5,
  status: 'SUBMITTED',
};

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockAuthReq = (overrides: Record<string, any> = {}): any => ({
  user: { user_id: 5, role: 'CITIZEN', roles: ['CITIZEN'] },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

describe('ApplicationController', () => {
  // ─── submitApplication ───────────────────────────────────────────────────────

  describe('submitApplication', () => {
    it('returns 201 on successful submission', async () => {
      jest.spyOn(ApplicationService.prototype, 'submitApplication').mockResolvedValue(mockApp as any);
      const req = mockAuthReq({ body: { department_id: 3 } });
      const res = mockRes();

      await submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Application submitted successfully' }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(ApplicationService.prototype, 'submitApplication').mockRejectedValue(new Error('Service not found'));
      const req = mockAuthReq({ body: { service_id: 999 } });
      const res = mockRes();

      await submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── getApplication ──────────────────────────────────────────────────────────

  describe('getApplication', () => {
    it('returns application on success', async () => {
      jest.spyOn(ApplicationService.prototype, 'getApplication').mockResolvedValue(mockApp as any);
      const req = mockAuthReq({ params: { id: '1' } });
      const res = mockRes();

      await getApplication(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 when not found', async () => {
      jest.spyOn(ApplicationService.prototype, 'getApplication').mockRejectedValue(new Error('Application not found'));
      const req = mockAuthReq({ params: { id: '999' } });
      const res = mockRes();

      await getApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── getApplicationByTracking ────────────────────────────────────────────────

  describe('getApplicationByTracking', () => {
    it('returns application by tracking id', async () => {
      const spy = jest.spyOn(ApplicationService.prototype, 'getApplicationByTrackingId').mockResolvedValue(mockApp as any);
      const req = mockAuthReq({ params: { trackingId: 'APP-2026-0001' } });
      const res = mockRes();

      await getApplicationByTracking(req, res);

      expect(spy).toHaveBeenCalledWith('APP-2026-0001');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 on missing tracking id', async () => {
      jest.spyOn(ApplicationService.prototype, 'getApplicationByTrackingId').mockRejectedValue(new Error('Application not found'));
      const req = mockAuthReq({ params: { trackingId: 'INVALID' } });
      const res = mockRes();

      await getApplicationByTracking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── listApplications ────────────────────────────────────────────────────────

  describe('listApplications', () => {
    it('scopes to user_id for CITIZEN role', async () => {
      const spy = jest.spyOn(ApplicationService.prototype, 'listApplications').mockResolvedValue({ data: [mockApp], total: 1, page: 1, limit: 10 } as any);
      const req = mockAuthReq({
        user: { user_id: 5, role: 'CITIZEN', roles: ['CITIZEN'] },
        query: {},
      });
      const res = mockRes();

      await listApplications(req, res);

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ user_id: 5 }));
    });

    it('does not scope to user_id for OFFICER role', async () => {
      const spy = jest.spyOn(ApplicationService.prototype, 'listApplications').mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 } as any);
      const req = mockAuthReq({
        user: { user_id: 2, role: 'OFFICER', roles: ['OFFICER'] },
        query: {},
      });
      const res = mockRes();

      await listApplications(req, res);

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ user_id: undefined }));
    });

    it('scopes to user_id for USER role (legacy)', async () => {
      const spy = jest.spyOn(ApplicationService.prototype, 'listApplications').mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 } as any);
      const req = mockAuthReq({
        user: { user_id: 8, role: 'USER', roles: ['USER'] },
        query: {},
      });
      const res = mockRes();

      await listApplications(req, res);

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ user_id: 8 }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(ApplicationService.prototype, 'listApplications').mockRejectedValue(new Error('DB error'));
      const req = mockAuthReq({ query: {} });
      const res = mockRes();

      await listApplications(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── processApplication ──────────────────────────────────────────────────────

  describe('processApplication', () => {
    it('returns updated application on success', async () => {
      jest.spyOn(ApplicationService.prototype, 'processApplication').mockResolvedValue({ ...mockApp, status: 'REVIEWING' } as any);
      const req = mockAuthReq({
        params: { id: '1' },
        body: { status: 'REVIEWING', notes: 'Under review' },
        user: { user_id: 2, role: 'OFFICER', roles: ['OFFICER'] },
      });
      const res = mockRes();

      await processApplication(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Application updated' }));
    });

    it('returns 400 on invalid transition', async () => {
      jest.spyOn(ApplicationService.prototype, 'processApplication').mockRejectedValue(new Error('Invalid status transition'));
      const req = mockAuthReq({ params: { id: '1' }, body: { status: 'SUBMITTED' } });
      const res = mockRes();

      await processApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── uploadDocument ──────────────────────────────────────────────────────────

  describe('uploadDocument', () => {
    it('returns 201 on successful upload', async () => {
      jest.spyOn(ApplicationService.prototype, 'uploadDocument').mockResolvedValue({ doc_id: 1 } as any);
      const req = mockAuthReq({
        params: { id: '1' },
        body: { doc_type: 'NID', file_name: 'nid.jpg', file_url: '/uploads/nid.jpg' },
      });
      const res = mockRes();

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Document uploaded' }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(ApplicationService.prototype, 'uploadDocument').mockRejectedValue(new Error('Application not found'));
      const req = mockAuthReq({ params: { id: '999' }, body: {} });
      const res = mockRes();

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── getTimeline ─────────────────────────────────────────────────────────────

  describe('getTimeline', () => {
    it('returns timeline updates', async () => {
      jest.spyOn(ApplicationService.prototype, 'getTimeline').mockResolvedValue([{ update_id: 1 }] as any);
      const req = mockAuthReq({ params: { id: '1' } });
      const res = mockRes();

      await getTimeline(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(ApplicationService.prototype, 'getTimeline').mockRejectedValue(new Error('fail'));
      const req = mockAuthReq({ params: { id: '1' } });
      const res = mockRes();

      await getTimeline(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── provideFeedback ─────────────────────────────────────────────────────────

  describe('provideFeedback', () => {
    it('submits feedback successfully', async () => {
      jest.spyOn(ApplicationService.prototype, 'provideFeedback').mockResolvedValue({ ...mockApp, status: 'CLOSED' } as any);
      const req = mockAuthReq({ params: { id: '1' }, body: { rating: 5, feedback: 'Excellent!' } });
      const res = mockRes();

      await provideFeedback(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Feedback submitted' }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(ApplicationService.prototype, 'provideFeedback').mockRejectedValue(new Error('Unauthorized'));
      const req = mockAuthReq({ params: { id: '1' }, body: { rating: 4 } });
      const res = mockRes();

      await provideFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── resubmitApplication ─────────────────────────────────────────────────────

  describe('resubmitApplication', () => {
    it('resubmits application successfully', async () => {
      jest.spyOn(ApplicationService.prototype, 'resubmitApplication').mockResolvedValue({ ...mockApp, status: 'RESUBMITTED' } as any);
      const req = mockAuthReq({ params: { id: '1' }, body: { message: 'Here are the docs' } });
      const res = mockRes();

      await resubmitApplication(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Application resubmitted successfully' }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(ApplicationService.prototype, 'resubmitApplication').mockRejectedValue(new Error('Not waiting for docs'));
      const req = mockAuthReq({ params: { id: '1' }, body: { message: '' } });
      const res = mockRes();

      await resubmitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
