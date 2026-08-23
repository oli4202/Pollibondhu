import request from 'supertest';
import app from '../../src/app';
import { prismaMock } from '../setup';

describe('Agriculture API Integration', () => {
  it('GET /api/agriculture/crops - should list crops', async () => {
    prismaMock.crop.findMany.mockResolvedValue([]);
    prismaMock.crop.count.mockResolvedValue(0);

    const res = await request(app).get('/api/agriculture/crops');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/agriculture/market-prices - should list prices', async () => {
    prismaMock.marketPrice.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/agriculture/market-prices');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/agriculture/weather - should return weather', async () => {
    prismaMock.weather.findFirst.mockResolvedValue({ weather_id: 1, district: 'Dhaka', temperature: 28, condition: 'Sunny', humidity: 70, rainfall: 0, uv_index: 'High', updated_by: 1, created_at: new Date() } as any);

    const res = await request(app).get('/api/agriculture/weather');
    expect(res.status).toBe(200);
    expect(res.body.data.district).toBe('Dhaka');
  });
});
