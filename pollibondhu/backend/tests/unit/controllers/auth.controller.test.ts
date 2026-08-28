/**
 * Unit tests — Auth Controller
 * The controller resolves its AuthService through the DatabaseManager
 * singleton, which setup.ts replaces with prismaMock. Hashing/token utils are
 * module-mocked so tests focus on controller branching + status codes.
 */
import { prismaMock } from '../../setup';
import * as authController from '../../../src/controllers/auth.controller';
import { hashPassword } from '../../../src/utils/bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../../src/utils/jwt';

jest.mock('../../../src/utils/bcrypt');
jest.mock('../../../src/utils/jwt');

const makeReq = (body: any = {}) => ({ body }) as any;
const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const dbUser = {
  user_id: 1,
  email: 'rahim@example.com',
  full_name: 'Rahim Uddin',
  role: 'CITIZEN',
  is_active: true,
  password_hash: '$2a$12$hash',
};

describe('Auth Controller', () => {
  beforeEach(() => {
    (hashPassword as jest.Mock).mockResolvedValue('$2a$12$hash');
    (generateAccessToken as jest.Mock).mockReturnValue('access-token');
    (generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
  });

  describe('register', () => {
    it('returns 201 and a token pair on success', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(dbUser as any);
      prismaMock.role.findUnique.mockResolvedValue(null);

      const res = makeRes();
      await authController.register(
        makeReq({ email: 'rahim@example.com', password: 'pw123456', full_name: 'Rahim Uddin' }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(201);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBe('access-token');
    });

    it('maps a rejected registration to a 400 envelope', async () => {
      prismaMock.user.findUnique.mockResolvedValue(dbUser as any); // duplicate

      const res = makeRes();
      await authController.register(makeReq({ email: 'rahim@example.com' }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Email already registered' });
    });
  });

  describe('login', () => {
    it('returns tokens on successful login', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(dbUser as any)
        .mockResolvedValueOnce({ ...dbUser, user_roles: [] } as any);

      const res = makeRes();
      await authController.login(makeReq({ email: dbUser.email, password: 'pw' }), res);

      expect(res.status).not.toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Login successful' })
      );
    });

    it('returns 401 for invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = makeRes();
      await authController.login(makeReq({ email: 'ghost@x.com', password: 'nope' }), res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid credentials' });
    });
  });

  describe('forgotPassword / resetPassword validation', () => {
    it('forgotPassword requires an email field', async () => {
      const res = makeRes();
      await authController.forgotPassword(makeReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Email is required' });
    });

    it('resetPassword requires all fields', async () => {
      const res = makeRes();
      await authController.resetPassword(makeReq({ email: 'a@b.com' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('resetPassword enforces minimum password length', async () => {
      const res = makeRes();
      await authController.resetPassword(makeReq({ email: 'a@b.com', otp: '1', newPassword: '12345' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    });
  });
});
