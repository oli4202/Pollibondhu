/**
 * Unit tests — Complaint Controller
 * Verifies role-aware list scoping (citizen sees own, officer sees assigned,
 * admin sees all) and error-to-status mapping.
 */
import { prismaMock } from '../../setup';
import * as complaintController from '../../../src/controllers/complaint.controller';

const makeReq = (overrides: Partial<any> = {}) => ({
  body: {},
  query: {},
  params: {},
  user: { user_id: 5, roles: ['CITIZEN'] },
  ...overrides,
}) as any;
const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Complaint Controller', () => {
  describe('submitComplaint', () => {
    it('returns 201 with the created complaint', async () => {
      prismaMock.complaint.create.mockResolvedValue({ complaint_id: 10 } as any);

      const req = makeReq({ body: { title: 'Road damage' }, user: { user_id: 5, roles: ['CITIZEN'] } });
      const res = makeRes();
      await complaintController.submitComplaint(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Complaint submitted' })
      );
    });

    it('maps failures to 400', async () => {
      prismaMock.complaint.create.mockRejectedValue(new Error('DB down'));

      const res = makeRes();
      await complaintController.submitComplaint(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'DB down' });
    });
  });

  describe('listComplaints scoping', () => {
    beforeEach(() => {
      prismaMock.complaint.findMany.mockResolvedValue([]);
      prismaMock.complaint.count.mockResolvedValue(0);
    });

    it('citizens only see their own complaints', async () => {
      const res = makeRes();
      await complaintController.listComplaints(makeReq(), res);

      const where: any = prismaMock.complaint.findMany.mock.calls[0]?.[0]?.where ?? {};
      expect(where.user_id).toBe(5);
      expect(where.assigned_to).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(200); // success envelope via sendSuccess
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('officers see complaints assigned to them', async () => {
      const req = makeReq({ user: { user_id: 9, roles: ['OFFICER'] } });
      const res = makeRes();
      await complaintController.listComplaints(req, res);

      const where: any = prismaMock.complaint.findMany.mock.calls[0]?.[0]?.where ?? {};
      expect(where.user_id).toBeUndefined();
      expect(where.assigned_to).toBe(9);
    });

    it('admins see everything without scoping', async () => {
      const req = makeReq({ user: { user_id: 1, roles: ['SUPER_ADMIN'] } });
      const res = makeRes();
      await complaintController.listComplaints(req, res);

      const where: any = prismaMock.complaint.findMany.mock.calls[0]?.[0]?.where ?? {};
      expect(where.user_id).toBeUndefined();
      expect(where.assigned_to).toBeUndefined();
    });

    it('parses pagination params with sane defaults', async () => {
      await complaintController.listComplaints(makeReq({ query: { page: '3', limit: '25' } }), makeRes());
      expect(prismaMock.complaint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 50, take: 25 })
      );
    });
  });

  describe('updateComplaintStatus', () => {
    it('updates on behalf of the authenticated officer', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue({ complaint_id: 10, assigned_to: 9 } as any);
      prismaMock.complaint.update.mockResolvedValue({ complaint_id: 10, status: 'REVIEWING' } as any);

      const req = makeReq({
        params: { id: '10' },
        body: { status: 'REVIEWING' },
        user: { user_id: 9, roles: ['OFFICER'] },
      });
      const res = makeRes();
      await complaintController.updateComplaintStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Complaint status updated' })
      );
    });

    it('maps authorization failures to 400', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue({ complaint_id: 10, assigned_to: 99 } as any);

      const req = makeReq({
        params: { id: '10' },
        body: { status: 'RESOLVED' },
        user: { user_id: 9, roles: ['OFFICER'] },
      });
      const res = makeRes();
      await complaintController.updateComplaintStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].success).toBe(false);
    });
  });
});
