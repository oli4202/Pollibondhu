/**
 * Unit tests — Repository layer
 * ApplicationRepository, ServiceRepository, ComplaintRepository
 * All backed by the global prismaMock.
 */
import { prismaMock } from '../../setup';
import { ApplicationRepository } from '../../../src/repositories/application.repository';
import { ServiceRepository } from '../../../src/repositories/service.repository';
import { ComplaintRepository } from '../../../src/repositories/complaint.repository';

// ─────────────────────────────────────────────────────────────────────────────
// ApplicationRepository
// ─────────────────────────────────────────────────────────────────────────────

describe('ApplicationRepository', () => {
  let repo: ApplicationRepository;

  const mockApp = {
    application_id: 1,
    tracking_id: 'APP-2026-0001',
    user_id: 5,
    status: 'SUBMITTED',
  };

  beforeEach(() => {
    repo = new ApplicationRepository(prismaMock);
  });

  describe('findById', () => {
    it('returns application with includes when found', async () => {
      prismaMock.application.findUnique.mockResolvedValue(mockApp as any);
      const result = await repo.findById(1);
      expect(result).toEqual(mockApp);
      expect(prismaMock.application.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { application_id: 1 } })
      );
    });

    it('returns null when not found', async () => {
      prismaMock.application.findUnique.mockResolvedValue(null);
      const result = await repo.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByTrackingId', () => {
    it('returns application when tracking id matches', async () => {
      prismaMock.application.findUnique.mockResolvedValue(mockApp as any);
      const result = await repo.findByTrackingId('APP-2026-0001');
      expect(prismaMock.application.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tracking_id: 'APP-2026-0001' } })
      );
      expect(result).toEqual(mockApp);
    });
  });

  describe('findAll', () => {
    it('filters by status when provided', async () => {
      prismaMock.application.findMany.mockResolvedValue([mockApp] as any);
      prismaMock.application.count.mockResolvedValue(1);

      const result = await repo.findAll({ page: 1, limit: 10, status: 'SUBMITTED' });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('filters by user_id, service_id, department_id, provider_id', async () => {
      prismaMock.application.findMany.mockResolvedValue([]);
      prismaMock.application.count.mockResolvedValue(0);

      await repo.findAll({ page: 1, limit: 5, user_id: 5, service_id: 10, department_id: 2, provider_id: 3 });

      expect(prismaMock.application.findMany).toHaveBeenCalled();
    });

    it('paginates correctly (page 2)', async () => {
      prismaMock.application.findMany.mockResolvedValue([]);
      prismaMock.application.count.mockResolvedValue(20);

      const result = await repo.findAll({ page: 2, limit: 10 });
      expect(result.page).toBe(2);
    });
  });

  describe('create', () => {
    it('creates an application and returns it', async () => {
      prismaMock.application.create.mockResolvedValue(mockApp as any);
      const result = await repo.create({ user: { connect: { user_id: 5 } }, status: 'SUBMITTED', priority: 'NORMAL', tracking_id: 'APP-2026-0001' });
      expect(prismaMock.application.create).toHaveBeenCalled();
      expect(result).toEqual(mockApp);
    });
  });

  describe('update', () => {
    it('updates and returns the updated application', async () => {
      prismaMock.application.update.mockResolvedValue({ ...mockApp, status: 'REVIEWING' } as any);
      const result = await repo.update(1, { status: 'REVIEWING' });
      expect(result.status).toBe('REVIEWING');
    });
  });

  describe('addUpdate', () => {
    it('creates an application update record', async () => {
      prismaMock.applicationUpdate.create.mockResolvedValue({ update_id: 1 } as any);
      await repo.addUpdate(1, { user_id: 5, new_status: 'REVIEWING', notes: 'Updated' });
      expect(prismaMock.applicationUpdate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ application_id: 1 }) })
      );
    });
  });

  describe('addDocument', () => {
    it('creates a document record', async () => {
      prismaMock.applicationDocument.create.mockResolvedValue({ doc_id: 1 } as any);
      await repo.addDocument({ application: { connect: { application_id: 1 } }, user: { connect: { user_id: 5 } }, doc_type: 'NID', file_name: 'nid.jpg', file_url: '/uploads/nid.jpg' });
      expect(prismaMock.applicationDocument.create).toHaveBeenCalled();
    });
  });

  describe('countByStatus', () => {
    it('returns count for given status', async () => {
      prismaMock.application.count.mockResolvedValue(7);
      const count = await repo.countByStatus('SUBMITTED');
      expect(count).toBe(7);
    });
  });

  describe('generateTrackingId', () => {
    it('generates a tracking id in APP-YYYY-NNNN format', async () => {
      prismaMock.application.count.mockResolvedValue(0);
      const id = await repo.generateTrackingId();
      expect(id).toMatch(/^APP-\d{4}-\d{4}$/);
    });

    it('increments sequence for subsequent applications', async () => {
      prismaMock.application.count.mockResolvedValue(9);
      const id = await repo.generateTrackingId();
      expect(id).toMatch(/APP-\d{4}-0010/);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ServiceRepository
// ─────────────────────────────────────────────────────────────────────────────

describe('ServiceRepository', () => {
  let repo: ServiceRepository;

  const mockService = { service_id: 1, title: 'Tractor Rental', status: 'APPROVED', is_available: true };

  beforeEach(() => {
    repo = new ServiceRepository(prismaMock);
  });

  describe('findById', () => {
    it('returns service with provider and category includes', async () => {
      prismaMock.service.findUnique.mockResolvedValue(mockService as any);
      const result = await repo.findById(1);
      expect(result).toEqual(mockService);
    });

    it('returns null when not found', async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);
      const result = await repo.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('filters by status', async () => {
      prismaMock.service.findMany.mockResolvedValue([mockService] as any);
      prismaMock.service.count.mockResolvedValue(1);
      const result = await repo.findAll({ page: 1, limit: 10, status: 'APPROVED' });
      expect(result.total).toBe(1);
    });

    it('filters by provider_id', async () => {
      prismaMock.service.findMany.mockResolvedValue([]);
      prismaMock.service.count.mockResolvedValue(0);
      await repo.findAll({ page: 1, limit: 10, provider_id: 5 });
      expect(prismaMock.service.findMany).toHaveBeenCalled();
    });

    it('filters by availableOnly', async () => {
      prismaMock.service.findMany.mockResolvedValue([]);
      prismaMock.service.count.mockResolvedValue(0);
      await repo.findAll({ page: 1, limit: 10, availableOnly: true });
      expect(prismaMock.service.findMany).toHaveBeenCalled();
    });

    it('filters by search term', async () => {
      prismaMock.service.findMany.mockResolvedValue([]);
      prismaMock.service.count.mockResolvedValue(0);
      await repo.findAll({ page: 1, limit: 10, search: 'tractor' });
      expect(prismaMock.service.findMany).toHaveBeenCalled();
    });

    it('ignores blank search term', async () => {
      prismaMock.service.findMany.mockResolvedValue([]);
      prismaMock.service.count.mockResolvedValue(0);
      await repo.findAll({ page: 1, limit: 10, search: '   ' });
      expect(prismaMock.service.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('creates and returns the service', async () => {
      prismaMock.service.create.mockResolvedValue(mockService as any);
      const result = await repo.create({ title: 'Tractor Rental', provider: { connect: { user_id: 5 } }, status: 'PENDING' } as any);
      expect(result).toEqual(mockService);
    });
  });

  describe('update', () => {
    it('updates and returns the service', async () => {
      prismaMock.service.update.mockResolvedValue({ ...mockService, title: 'Updated' } as any);
      const result = await repo.update(1, { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('deletes and returns the deleted service', async () => {
      prismaMock.service.delete.mockResolvedValue(mockService as any);
      const result = await repo.delete(1);
      expect(result.service_id).toBe(1);
    });
  });

  describe('countByStatus', () => {
    it('returns count for status', async () => {
      prismaMock.service.count.mockResolvedValue(12);
      const count = await repo.countByStatus('APPROVED');
      expect(count).toBe(12);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ComplaintRepository
// ─────────────────────────────────────────────────────────────────────────────

describe('ComplaintRepository', () => {
  let repo: ComplaintRepository;

  const mockComplaint = { complaint_id: 10, user_id: 5, status: 'PENDING', assigned_to: null };

  beforeEach(() => {
    repo = new ComplaintRepository(prismaMock);
  });

  describe('findById', () => {
    it('returns complaint with user and reviewer includes', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue(mockComplaint as any);
      const result = await repo.findById(10);
      expect(result).toEqual(mockComplaint);
    });

    it('returns null when not found', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue(null);
      const result = await repo.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('filters by status', async () => {
      prismaMock.complaint.findMany.mockResolvedValue([mockComplaint] as any);
      prismaMock.complaint.count.mockResolvedValue(1);
      const result = await repo.findAll({ page: 1, limit: 10, status: 'PENDING' });
      expect(result.total).toBe(1);
    });

    it('filters by user_id', async () => {
      prismaMock.complaint.findMany.mockResolvedValue([]);
      prismaMock.complaint.count.mockResolvedValue(0);
      await repo.findAll({ page: 1, limit: 10, user_id: 5 });
      expect(prismaMock.complaint.findMany).toHaveBeenCalled();
    });

    it('filters by assigned_to', async () => {
      prismaMock.complaint.findMany.mockResolvedValue([]);
      prismaMock.complaint.count.mockResolvedValue(0);
      await repo.findAll({ page: 1, limit: 10, assigned_to: 7 });
      expect(prismaMock.complaint.findMany).toHaveBeenCalled();
    });

    it('paginates correctly', async () => {
      prismaMock.complaint.findMany.mockResolvedValue([]);
      prismaMock.complaint.count.mockResolvedValue(100);
      const result = await repo.findAll({ page: 3, limit: 10 });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
    });
  });

  describe('create', () => {
    it('creates and returns the complaint', async () => {
      prismaMock.complaint.create.mockResolvedValue(mockComplaint as any);
      const result = await repo.create({ user: { connect: { user_id: 5 } }, status: 'PENDING' } as any);
      expect(result).toEqual(mockComplaint);
    });
  });

  describe('update', () => {
    it('updates and returns complaint', async () => {
      prismaMock.complaint.update.mockResolvedValue({ ...mockComplaint, status: 'RESOLVED' } as any);
      const result = await repo.update(10, { status: 'RESOLVED' as any });
      expect(result.status).toBe('RESOLVED');
    });
  });
});
