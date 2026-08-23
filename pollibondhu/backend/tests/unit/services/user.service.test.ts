import { UserService } from '../../../src/services/user.service';
import { mockUser } from '../../mocks/data.mock';
import { prismaMock } from '../../setup';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService(prismaMock as any);
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await userService.getProfile(1);

      expect(result).toBeDefined();
      expect(result.password_hash).toBeUndefined();
    });

    it('should throw error if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(userService.getProfile(999)).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update profile and strip sensitive fields', async () => {
      prismaMock.user.update.mockResolvedValue(mockUser as any);

      await userService.updateProfile(1, { full_name: 'Updated Name', role: 'ADMIN' as any });

      const callArg = prismaMock.user.update.mock.calls[0][0].data as any;
      expect(callArg.role).toBeUndefined();
      expect(callArg.password_hash).toBeUndefined();
    });
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser] as any);
      prismaMock.user.count.mockResolvedValue(1);

      const result = await userService.listUsers({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('toggleUserStatus', () => {
    it('should activate/deactivate user', async () => {
      prismaMock.user.update.mockResolvedValue({ ...mockUser, is_active: false } as any);

      const result = await userService.toggleUserStatus(1, false);

      expect(result.is_active).toBe(false);
    });
  });
});
