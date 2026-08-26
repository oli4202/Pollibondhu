/**
 * Unit tests — middleware
 * validate(): passes valid bodies to next(), rejects invalid ones.
 * errorMiddleware(): normalizes any thrown error into the JSON envelope.
 */
import { z } from 'zod';
import { validate } from '../../../src/middleware/validate.middleware';
import { errorMiddleware } from '../../../src/middleware/error.middleware';
import { logger } from '../../../src/patterns/singleton/Logger';

const makeReq = (body: any) => ({ body }) as any;
const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validate middleware', () => {
  const schema = z.object({ email: z.string().email(), age: z.number().min(18) });
  let next: jest.Mock;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next() for a valid body', () => {
    const res = makeRes();
    validate(schema)(makeReq({ email: 'a@b.com', age: 25 }), res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with field-level messages', () => {
    const res = makeRes();
    validate(schema)(makeReq({ email: 'not-an-email', age: 10 }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('email');
    expect(payload.error).toContain('age');
  });
});

describe('error middleware', () => {
  const req = { method: 'GET', path: '/api/boom' } as any;

  it('uses err.statusCode and err.message when present', () => {
    const res = makeRes();
    errorMiddleware({ statusCode: 403, message: 'Forbidden' }, req, res, jest.fn());

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('/api/boom'));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Forbidden' });
  });

  it('falls back to 500 / Internal Server Error for anonymous errors', () => {
    const res = makeRes();
    errorMiddleware(new Error(), req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Internal Server Error' });
  });
});
