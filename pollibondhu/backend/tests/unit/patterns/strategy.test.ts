/**
 * Unit tests — STRATEGY PATTERN
 * Each search strategy builds its own query; SearchContext swaps strategies
 * at runtime. All Prisma calls go through the deep mock.
 */
import {
  ServiceSearchStrategy,
  CropSearchStrategy,
  ExpertSearchStrategy,
  SearchContext,
} from '../../../src/patterns/strategy/SearchStrategy';
import { prismaMock } from '../../setup';

describe('Strategy Pattern — Search Strategies', () => {
  describe('ServiceSearchStrategy', () => {
    const strategy = new ServiceSearchStrategy();

    it('applies default pagination and base filters', async () => {
      prismaMock.service.findMany.mockResolvedValue([]);
      prismaMock.service.count.mockResolvedValue(0);

      const result = await strategy.search({}, prismaMock);

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
      expect(prismaMock.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'APPROVED', is_available: true },
          skip: 0,
          take: 10,
        })
      );
    });

    it('builds OR text search plus location/category/status filters', async () => {
      prismaMock.service.findMany.mockResolvedValue([]);
      prismaMock.service.count.mockResolvedValue(0);

      await strategy.search(
        { query: 'tractor', location: 'Dhaka', category: 'Rentals', status: 'PENDING', page: 2, limit: 5 },
        prismaMock
      );

      expect(prismaMock.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'PENDING',
            is_available: true,
            OR: [
              { title: { contains: 'tractor' } },
              { description: { contains: 'tractor' } },
            ],
            district: { contains: 'Dhaka' },
            category: { name: { equals: 'Rentals' } },
          },
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('CropSearchStrategy', () => {
    it('searches English and Bangla names and maps category to season', async () => {
      prismaMock.crop.findMany.mockResolvedValue([]);
      prismaMock.crop.count.mockResolvedValue(0);

      await new CropSearchStrategy().search(
        { query: 'rice', category: 'Aman', page: 1, limit: 20 },
        prismaMock
      );

      expect(prismaMock.crop.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'rice' } },
              { name_bn: { contains: 'rice' } },
            ],
            season: { equals: 'Aman' },
          },
          skip: 0,
          take: 20,
        })
      );
    });
  });

  describe('ExpertSearchStrategy', () => {
    it('only returns verified experts matching specialization/district', async () => {
      prismaMock.expert.findMany.mockResolvedValue([]);
      prismaMock.expert.count.mockResolvedValue(0);

      await new ExpertSearchStrategy().search(
        { query: 'soil', location: 'Sylhet', page: 3, limit: 10 },
        prismaMock
      );

      expect(prismaMock.expert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            is_verified: true,
            specialization: { contains: 'soil' },
            user: { district: { contains: 'Sylhet' } },
          },
          skip: 20,
          take: 10,
        })
      );
    });
  });

  describe('SearchContext (runtime strategy swapping)', () => {
    it('delegates to whichever strategy is currently set', async () => {
      prismaMock.service.findMany.mockResolvedValue([{ service_id: 1 }] as any);
      prismaMock.service.count.mockResolvedValue(1);
      prismaMock.crop.findMany.mockResolvedValue([{ crop_id: 9 }] as any);
      prismaMock.crop.count.mockResolvedValue(1);

      const context = new SearchContext(new ServiceSearchStrategy());
      let result = await context.execute({ query: 'x' }, prismaMock);
      expect(result.data).toEqual([{ service_id: 1 }]);

      // Swap the algorithm at runtime — same client code
      context.setStrategy(new CropSearchStrategy());
      result = await context.execute({ query: 'x' }, prismaMock);
      expect(result.data).toEqual([{ crop_id: 9 }]);
      expect(prismaMock.crop.findMany).toHaveBeenCalled();
    });
  });
});
