import { PrismaClient } from '@prisma/client';

export interface SearchCriteria {
  query?: string;
  location?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchStrategy<T> {
  search(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<T>>;
}

/**
 * Strategy Pattern: ServiceSearchStrategy
 * Problem: Service search needs location + provider joins, 
 * different from crop or expert search.
 * Solution: Encapsulate each search algorithm in its own strategy class.
 */
export class ServiceSearchStrategy implements SearchStrategy<any> {
  async search(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<any>> {
    const { query, location, category, status, page = 1, limit = 10 } = criteria;
    const skip = (page - 1) * limit;

    const where: any = { status: 'APPROVED', is_available: true };
    if (query) where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
    if (location) where.district = { contains: location, mode: 'insensitive' };
    if (status) where.status = status;
    if (category) where.category = { name: { equals: category, mode: 'insensitive' } };

    const [data, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: { provider: { select: { full_name: true, district: true, phone: true } }, category: true },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.service.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

export class CropSearchStrategy implements SearchStrategy<any> {
  async search(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<any>> {
    const { query, category, page = 1, limit = 10 } = criteria;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query) where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { name_bn: { contains: query, mode: 'insensitive' } },
    ];
    if (category) where.season = { equals: category, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      prisma.crop.findMany({ where, skip, take: limit, include: { category: true } }),
      prisma.crop.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

export class ExpertSearchStrategy implements SearchStrategy<any> {
  async search(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<any>> {
    const { query, location, page = 1, limit = 10 } = criteria;
    const skip = (page - 1) * limit;

    const where: any = { is_verified: true };
    if (query) where.specialization = { contains: query, mode: 'insensitive' };
    if (location) where.user = { district: { contains: location, mode: 'insensitive' } };

    const [data, total] = await Promise.all([
      prisma.expert.findMany({
        where,
        include: { user: { select: { full_name: true, district: true, avatar_url: true } } },
        skip,
        take: limit,
      }),
      prisma.expert.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

/**
 * SearchContext: Uses a strategy dynamically based on entity type.
 */
export class SearchContext<T> {
  private strategy: SearchStrategy<T>;

  constructor(strategy: SearchStrategy<T>) {
    this.strategy = strategy;
  }

  setStrategy(strategy: SearchStrategy<T>): void {
    this.strategy = strategy;
  }

  async execute(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<T>> {
    return this.strategy.search(criteria, prisma);
  }
}
