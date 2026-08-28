/**
 * Unit tests — UserController
 * All HTTP handlers tested with mock request/response objects.
 * UserService methods are spied on via prototype to intercept the module-level singleton.
 */
import { Response } from 'express';
import { UserService } from '../../../src/services/user.service';

// Import controller AFTER setting up mocks so the module-level singleton uses the mock prisma
import {
  getProfile, updateProfile, listUsers, toggleUserStatus, changeRole,
} from '../../../src/controllers/user.controller';

const mockUser = {
  user_id: 5,
  email: 'rahim@example.com',
  full_name: 'Rahim Uddin',
  role: 'CITIZEN',
  is_active: true,
  roles: ['CITIZEN'],
  permissions: ['complaint.create'],
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

describe('UserController', () => {
  // ─── getProfile ───────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns 200 with user profile', async () => {
      jest.spyOn(UserService.prototype, 'getProfile').mockResolvedValue(mockUser as any);
      const req = mockAuthReq();
      const res = mockRes();

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 when user not found', async () => {
      jest.spyOn(UserService.prototype, 'getProfile').mockRejectedValue(new Error('User not found'));
      const req = mockAuthReq();
      const res = mockRes();

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── updateProfile ────────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('returns 200 with updated profile', async () => {
      jest.spyOn(UserService.prototype, 'updateProfile').mockResolvedValue({ ...mockUser, full_name: 'Updated' } as any);
      const req = mockAuthReq({ body: { full_name: 'Updated' } });
      const res = mockRes();

      await updateProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Profile updated' }));
    });

    it('returns 400 on update error', async () => {
      jest.spyOn(UserService.prototype, 'updateProfile').mockRejectedValue(new Error('Validation failed'));
      const req = mockAuthReq({ body: {} });
      const res = mockRes();

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── listUsers ────────────────────────────────────────────────────────────────

  describe('listUsers', () => {
    it('returns paginated user list with role filter', async () => {
      const spy = jest.spyOn(UserService.prototype, 'listUsers').mockResolvedValue({ data: [mockUser], total: 1, page: 1, limit: 10 } as any);
      const req = mockAuthReq({ query: { page: '1', limit: '10', role: 'CITIZEN' } });
      const res = mockRes();

      await listUsers(req, res);

      expect(spy).toHaveBeenCalledWith({ page: 1, limit: 10, role: 'CITIZEN', search: undefined });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('defaults page and limit when not provided', async () => {
      const spy = jest.spyOn(UserService.prototype, 'listUsers').mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
      const req = mockAuthReq({ query: {} });
      const res = mockRes();

      await listUsers(req, res);

      expect(spy).toHaveBeenCalledWith({ page: 1, limit: 10, role: undefined, search: undefined });
    });

    it('returns 400 on error', async () => {
      jest.spyOn(UserService.prototype, 'listUsers').mockRejectedValue(new Error('DB error'));
      const req = mockAuthReq({ query: {} });
      const res = mockRes();

      await listUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── toggleUserStatus ─────────────────────────────────────────────────────────

  describe('toggleUserStatus', () => {
    it('deactivates a user successfully', async () => {
      const spy = jest.spyOn(UserService.prototype, 'toggleUserStatus').mockResolvedValue({ ...mockUser, is_active: false } as any);
      const req = mockAuthReq({ params: { id: '5' }, body: { is_active: false } });
      const res = mockRes();

      await toggleUserStatus(req, res);

      expect(spy).toHaveBeenCalledWith(5, false);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User status updated' }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(UserService.prototype, 'toggleUserStatus').mockRejectedValue(new Error('Not found'));
      const req = mockAuthReq({ params: { id: '999' }, body: { is_active: false } });
      const res = mockRes();

      await toggleUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── changeRole ────────────────────────────────────────────────────────────────

  describe('changeRole', () => {
    it('updates user role and returns updated user', async () => {
      const spy = jest.spyOn(UserService.prototype, 'changeRole').mockResolvedValue({ ...mockUser, role: 'OFFICER' } as any);
      const req = mockAuthReq({ params: { id: '5' }, body: { role: 'OFFICER' } });
      const res = mockRes();

      await changeRole(req, res);

      expect(spy).toHaveBeenCalledWith(5, 'OFFICER');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User role updated' }));
    });

    it('returns 400 on error', async () => {
      jest.spyOn(UserService.prototype, 'changeRole').mockRejectedValue(new Error('Invalid role'));
      const req = mockAuthReq({ params: { id: '5' }, body: { role: 'INVALID' } });
      const res = mockRes();

      await changeRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
