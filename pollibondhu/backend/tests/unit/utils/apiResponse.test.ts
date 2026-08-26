/**
 * Unit tests — API response helpers
 * The Express Response object is stubbed; helpers must emit the standard
 * envelope { success, data | error, message }.
 */
import { sendSuccess, sendError } from '../../../src/utils/apiResponse';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('API response helpers', () => {
  it('sendSuccess emits a success envelope with data and message', () => {
    const res = makeRes();
    sendSuccess(res, { id: 1 }, 'Created!', 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 }, message: 'Created!' });
  });

  it('sendSuccess defaults to 200 and message "Success"', () => {
    const res = makeRes();
    sendSuccess(res, null);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: null, message: 'Success' });
  });

  it('sendError emits a failure envelope', () => {
    const res = makeRes();
    sendError(res, 'Something broke', 500);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Something broke' });
  });

  it('sendError defaults to status 400', () => {
    const res = makeRes();
    sendError(res, 'Bad input');
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
