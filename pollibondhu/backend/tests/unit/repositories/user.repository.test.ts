/**
 * Unit tests — UserRepository
 * Query construction is verified against the deep prismaMock: filters,
 * text search across three columns, and pagination math.
 */
import { prismaMock } from '../../setup';
import { UserRepository } from '../../../src/repositories/user.repository';

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = new UserRepository(prismaMock);
  });

  it('findByEmail delegates to prisma.user.findUnique', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ user_id: 1 } as any);
    const user = await repo.findByEmail('a@b.com');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    expect(user).toMatchObject({ user_id: 1 });
  });

  it('findById delegates to prisma.user.findUnique', async () => {
    await repo.findById(7);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { user_id: 7 } });
  });

  describe('findAll', () => {
    it('paginates with no extra filters', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      const result = await repo.findAll({ page: 3, limit: 10 });

      expect(result).toEqual({ data: [], total: 0, page: 3, limit: 10 });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10, where: {} })
      );
    });

    it('adds a role filter when provided', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await repo.findAll({ page: 1, limit: 10, role: 'OFFICER' });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'OFFICER' } })
      );
    });

    it('searches name, email and district with OR', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await repo.findAll({ page: 1, limit: 10, search: 'karim' });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { full_name: { contains: 'karim' } },
              { email: { contains: 'karim' } },
              { district: { contains: 'karim' } },
            ],
          },
        })
      );
    });
  });

  it('create / update / delete delegate to prisma', async () => {
    prismaMock.user.create.mockResolvedValue({ user_id: 1 } as any);
    prismaMock.user.update.mockResolvedValue({ user_id: 1, is_active: false } as any);
    prismaMock.user.delete.mockResolvedValue({ user_id: 1 } as any);

    await repo.create({ email: 'x@y.z' } as any);
    expect(prismaMock.user.create).toHaveBeenCalledWith({ data: { email: 'x@y.z' } });

    await repo.update(1, { is_active: false });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { user_id: 1 },
      data: { is_active: false },
    });

    await repo.delete(1);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { user_id: 1 } });
  });

  it('countByRole counts users of a role', async () => {
    prismaMock.user.count.mockResolvedValue(12);
    const n = await repo.countByRole('CITIZEN');
    expect(n).toBe(12);
    expect(prismaMock.user.count).toHaveBeenCalledWith({ where: { role: 'CITIZEN' } });
  });
});
