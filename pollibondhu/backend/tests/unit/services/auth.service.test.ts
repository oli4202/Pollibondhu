/**
 * Unit tests — AuthService
 * External dependencies are isolated:
 *  - Database access via the deep prismaMock
 *  - Password hashing / token signing via jest module mocks
 */
import { prismaMock } from '../../setup';
import { AuthService } from '../../../src/services/auth.service';
import { hashPassword, comparePassword } from '../../../src/utils/bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../../src/utils/jwt';

jest.mock('../../../src/utils/bcrypt');
jest.mock('../../../src/utils/jwt');

const mockUser = {
  user_id: 1,
  email: 'rahim@example.com',
  full_name: 'Rahim Uddin',
  phone: '01700000000',
  role: 'CITIZEN',
  is_active: true,
  password_hash: 'hashed-password',
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(prismaMock);
    (hashPassword as jest.Mock).mockResolvedValue('hashed-password');
    (generateAccessToken as jest.Mock).mockReturnValue('access-token');
    (generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
  });

  describe('register', () => {
    const input = { email: 'rahim@example.com', password: 'Secret123!', full_name: 'Rahim Uddin' };

    it('creates a CITIZEN account, links RBAC role and returns tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // email free
      prismaMock.user.create.mockResolvedValue(mockUser as any);
      prismaMock.role.findUnique.mockResolvedValue({ role_id: 3, name: 'CITIZEN' } as any);
      prismaMock.userRole.create.mockResolvedValue({} as any);

      const result = await service.register(input);

      expect(prismaMock.role.findUnique).toHaveBeenCalledWith({ where: { name: 'CITIZEN' } });
      expect(prismaMock.userRole.create).toHaveBeenCalledWith({
        data: { user_id: 1, role_id: 3 },
      });
      expect(hashPassword).toHaveBeenCalledWith('Secret123!');
      expect(result.user.roles).toEqual(['CITIZEN']);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      // Never leaks the password hash
      expect(JSON.stringify(result)).not.toContain('password_hash');
    });

    it('maps legacy PROVIDER signup to SERVICE_PROVIDER role', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation((args: any) =>
        Promise.resolve({ ...mockUser, role: args.data.role }) as any
      );
      prismaMock.role.findUnique.mockResolvedValue(null);

      await service.register({ ...input, role: 'PROVIDER' });
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'SERVICE_PROVIDER' }) })
      );
    });

    it('rejects a duplicate email without hashing or creating anything', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.register(input)).rejects.toThrow('Email already registered');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(hashPassword).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.login('nobody@example.com', 'pw')).rejects.toThrow('Invalid credentials');
    });

    it('rejects a deactivated account before checking the password', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, is_active: false } as any);
      await expect(service.login(mockUser.email, 'pw')).rejects.toThrow('Account deactivated');
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('rejects a wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (comparePassword as jest.Mock).mockResolvedValue(false);
      await expect(service.login(mockUser.email, 'wrong')).rejects.toThrow('Invalid credentials');
    });

    it('returns database RBAC roles + permissions on success', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser as any) // findByEmail
        .mockResolvedValueOnce({
          ...mockUser,
          user_roles: [
            {
              role: {
                name: 'OFFICER',
                role_permissions: [
                  { permission: { name: 'complaint.view' } },
                  { permission: { name: 'complaint.update' } },
                ],
              },
            },
          ],
        } as any);
      (comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.login(mockUser.email, 'correct');

      expect(result.user.roles).toEqual(['OFFICER']);
      expect(result.user.permissions).toEqual(['complaint.view', 'complaint.update']);
      expect(result.accessToken).toBe('access-token');
    });

    it('falls back to the legacy permission map when no DB roles exist', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce({ ...mockUser, user_roles: [] } as any);
      (comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.login(mockUser.email, 'correct');

      expect(result.user.roles).toEqual(['CITIZEN']); // fallback to column value
      expect(result.user.permissions).toContain('complaint.create');
      expect(result.user.permissions).toContain('ai.chat');
    });
  });

  describe('forgotPassword', () => {
    it('responds identically for unknown emails (no enumeration)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('ghost@example.com');

      expect(result.message).toContain('If an account with that email exists');
      expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('stores a hashed OTP for known users', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      prismaMock.passwordResetToken.create.mockResolvedValue({} as any);

      const result = await service.forgotPassword(mockUser.email);

      expect(result.message).toContain('reset code has been sent');
      expect(prismaMock.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 1,
          token_hash: expect.stringMatching(/^[a-f0-9]{64}$/), // sha256 hex
          expires_at: expect.any(Date),
        }),
      });
    });
  });

  describe('resetPassword', () => {
    it('rejects unknown users', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('ghost@example.com', '123456', 'NewPass1!'))
        .rejects.toThrow('Invalid reset request');
    });

    it('rejects invalid or expired codes', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword(mockUser.email, '000000', 'NewPass1!'))
        .rejects.toThrow('Invalid or expired reset code');
    });

    it('rotates the password atomically and marks the OTP used', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.passwordResetToken.findFirst.mockResolvedValue({
        reset_token_id: 11,
        token_hash: 'abc',
      } as any);
      prismaMock.$transaction.mockResolvedValue([]);
      (hashPassword as jest.Mock).mockClear();

      const result = await service.resetPassword(mockUser.email, '123456', 'NewPass1!');

      expect(result.message).toContain('Password reset successful');
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      const ops = prismaMock.$transaction.mock.calls[0]![0] as unknown as any[];
      expect(ops).toHaveLength(4); // update pw, mark used, prune tokens, revoke refresh tokens
    });
  });
});
