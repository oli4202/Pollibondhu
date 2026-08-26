/**
 * Unit tests — UserService
 * Profile enrichment (roles + permissions), the legacy permission fallback,
 * and protections against role escalation through profile updates.
 */
import { prismaMock } from '../../setup';
import { UserService } from '../../../src/services/user.service';

const baseUser = {
  user_id: 5,
  email: 'karim@example.com',
  full_name: 'Karim Mia',
  role: 'CITIZEN',
  is_active: true,
  user_roles: [] as any[],
  user_departments: [{ department_id: 2 }],
  user_locations: [{ location_id: 8 }],
};

describe('UserService', () => {
  let svc: UserService;

  beforeEach(() => {
    svc = new UserService(prismaMock);
  });

  describe('getProfile', () => {
    it('throws for missing users', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(svc.getProfile(404)).rejects.toThrow('User not found');
    });

    it('returns database roles + permissions when assigned', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        user_roles: [
          {
            role: {
              name: 'OFFICER',
              role_permissions: [
                { permission: { name: 'complaint.resolve' } },
                { permission: { name: 'user.view' } },
              ],
            },
          },
        ],
      } as any);

      const profile = await svc.getProfile(5);

      expect(profile.roles).toEqual(['OFFICER']);
      expect(profile.permissions).toEqual(['complaint.resolve', 'user.view']);
      expect(profile.department_ids).toEqual([2]);
      expect(profile.location_ids).toEqual([8]);
    });

    it('falls back to legacy CITIZEN permissions without DB roles', async () => {
      prismaMock.user.findUnique.mockResolvedValue(baseUser as any);

      const profile = await svc.getProfile(5);

      expect(profile.roles).toEqual(['CITIZEN']); // column value used as role
      expect(profile.permissions).toContain('complaint.create');
      expect(profile.permissions).toContain('dashboard.citizen.view');
    });

    it('falls back to legacy ADMIN permissions for admins', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, role: 'ADMIN' } as any);

      const profile = await svc.getProfile(1);
      expect(profile.roles).toEqual(['ADMIN']);
      expect(profile.permissions).toContain('service.approve');
      expect(profile.permissions).toContain('settings.update');
    });
  });

  describe('updateProfile', () => {
    it('strips role and password_hash to prevent escalation', async () => {
      prismaMock.user.update.mockResolvedValue(baseUser as any);

      await svc.updateProfile(5, {
        full_name: 'Renamed',
        role: 'ADMIN',
        password_hash: '$2a$12$evil',
      } as any);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { user_id: 5 },
        data: { full_name: 'Renamed' },
      });
    });

    it('passes legitimate fields through untouched', async () => {
      prismaMock.user.update.mockResolvedValue(baseUser as any);

      await svc.updateProfile(5, { phone: '01811111111' } as any);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { user_id: 5 },
        data: { phone: '01811111111' },
      });
    });
  });

  describe('admin operations', () => {
    it('listUsers paginates through the repository', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      const result = await svc.listUsers({ page: 1, limit: 10, search: 'ka' });
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    });

    it('toggleUserStatus activates/deactivates accounts', async () => {
      prismaMock.user.update.mockResolvedValue({ ...baseUser, is_active: false } as any);

      await svc.toggleUserStatus(5, false);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { user_id: 5 },
        data: { is_active: false },
      });
    });

    it('changeRole updates the primary role column', async () => {
      prismaMock.user.update.mockResolvedValue({ ...baseUser, role: 'OFFICER' } as any);

      await svc.changeRole(5, 'OFFICER');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { user_id: 5 },
        data: { role: 'OFFICER' },
      });
    });
  });
});
