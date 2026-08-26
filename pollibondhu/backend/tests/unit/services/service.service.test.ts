/**
 * Unit tests — ServiceService
 * Covers category resolution, the approval observer event, and the
 * provider-ownership authorization rules.
 */
import { prismaMock } from '../../setup';
import { ServiceService } from '../../../src/services/service.service';
import { appEventSubject } from '../../../src/patterns/observer/NotificationSubject';

const service = {
  service_id: 42,
  provider_id: 7,
  title: 'Tractor Rental',
  status: 'PENDING',
};

describe('ServiceService', () => {
  let svc: ServiceService;

  beforeEach(() => {
    svc = new ServiceService(prismaMock);
    jest.spyOn(appEventSubject, 'notify').mockResolvedValue(undefined);
  });

  describe('createService', () => {
    it('creates a PENDING service connected to its provider', async () => {
      prismaMock.service.create.mockResolvedValue(service as any);

      await svc.createService({ title: 'Tractor Rental', price: 500 }, 7);

      expect(prismaMock.service.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Tractor Rental',
          provider: { connect: { user_id: 7 } },
          status: 'PENDING',
        }),
      });
    });

    it('resolves a named category to its id', async () => {
      prismaMock.category.findFirst.mockResolvedValue({ category_id: 3, name: 'Rentals' } as any);
      prismaMock.service.create.mockResolvedValue(service as any);

      await svc.createService({ title: 'T', category: 'Rentals' }, 7);

      expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
        where: { name: 'Rentals', type: 'SERVICE', is_active: true },
      });
      expect(prismaMock.service.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: { connect: { category_id: 3 } },
        }),
      });
    });

    it('normalizes "Government" to the "Citizen" category', async () => {
      prismaMock.category.findFirst.mockResolvedValue({ category_id: 1, name: 'Citizen' } as any);
      prismaMock.service.create.mockResolvedValue(service as any);

      await svc.createService({ title: 'NID help', category: 'Government' }, 7);

      expect(prismaMock.category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ name: 'Citizen' }) })
      );
    });

    it('rejects unavailable categories', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      await expect(svc.createService({ title: 'X', category: 'Ghost' }, 7))
        .rejects.toThrow('Selected service category is unavailable');
      expect(prismaMock.service.create).not.toHaveBeenCalled();
    });
  });

  describe('approveService', () => {
    it('approves and publishes SERVICE_APPROVED for the provider', async () => {
      prismaMock.service.update.mockResolvedValue({ ...service, status: 'APPROVED' } as any);

      const approved = await svc.approveService(42, adminId());

      expect(approved.status).toBe('APPROVED');
      expect(appEventSubject.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SERVICE_APPROVED', payload: expect.objectContaining({ provider_id: 7 }) }),
        prismaMock
      );
    });

    function adminId() { return 1; }
  });

  describe('updateService', () => {
    it('throws when service does not exist', async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);
      await expect(svc.updateService(999, { title: 'x' }, 7, 'SERVICE_PROVIDER'))
        .rejects.toThrow('Service not found');
    });

    it('blocks providers editing someone else\u2019s service', async () => {
      prismaMock.service.findUnique.mockResolvedValue({ ...service, provider_id: 99 } as any);
      await expect(svc.updateService(42, { title: 'x' }, 7, 'SERVICE_PROVIDER'))
        .rejects.toThrow('Unauthorized to update this service');
    });

    it('filters out disallowed fields and requires re-review for content changes', async () => {
      prismaMock.service.findUnique.mockResolvedValue(service as any);
      prismaMock.service.update.mockResolvedValue(service as any);

      await svc.updateService(42, { title: 'New Title', status: 'APPROVED', hack: true }, 7, 'SERVICE_PROVIDER');

      expect(prismaMock.service.update).toHaveBeenCalledWith({
        where: { service_id: 42 },
        data: expect.objectContaining({ title: 'New Title', status: 'PENDING' }),
      });
    });

    it('lets admins change content without forcing re-review', async () => {
      prismaMock.service.findUnique.mockResolvedValue(service as any);
      prismaMock.service.update.mockResolvedValue(service as any);

      await svc.updateService(42, { title: 'Admin Rename' }, 1, 'ADMIN');

      expect(prismaMock.service.update).toHaveBeenCalledWith({
        where: { service_id: 42 },
        data: expect.not.objectContaining({ status: 'PENDING' }),
      });
    });

    it('allows visibility toggles without re-review', async () => {
      prismaMock.service.findUnique.mockResolvedValue(service as any);
      prismaMock.service.update.mockResolvedValue(service as any);

      await svc.updateService(42, { is_available: false }, 7, 'SERVICE_PROVIDER');

      expect(prismaMock.service.update).toHaveBeenCalledWith({
        where: { service_id: 42 },
        data: expect.objectContaining({ is_available: false }),
      });
    });

    it('rejects updates containing no valid fields', async () => {
      prismaMock.service.findUnique.mockResolvedValue(service as any);
      await expect(svc.updateService(42, { nonsense: true }, 7, 'SERVICE_PROVIDER'))
        .rejects.toThrow('No valid service fields supplied');
    });

    it('rejects unknown categories on update', async () => {
      prismaMock.service.findUnique.mockResolvedValue(service as any);
      prismaMock.category.findFirst.mockResolvedValue(null);

      await expect(svc.updateService(42, { category: 'Ghost' }, 7, 'SERVICE_PROVIDER'))
        .rejects.toThrow('Selected service category is unavailable');
    });
  });

  describe('deleteService', () => {
    it('blocks non-owner providers', async () => {
      prismaMock.service.findUnique.mockResolvedValue({ ...service, provider_id: 99 } as any);
      await expect(svc.deleteService(42, 7, 'SERVICE_PROVIDER'))
        .rejects.toThrow('Unauthorized to delete this service');
    });

    it('deletes when owned by the provider', async () => {
      prismaMock.service.findUnique.mockResolvedValue(service as any);
      prismaMock.service.delete.mockResolvedValue(service as any);

      await svc.deleteService(42, 7, 'SERVICE_PROVIDER');
      expect(prismaMock.service.delete).toHaveBeenCalledWith({ where: { service_id: 42 } });
    });

    it('lets admins delete any service', async () => {
      prismaMock.service.findUnique.mockResolvedValue(service as any);
      prismaMock.service.delete.mockResolvedValue(service as any);

      await svc.deleteService(42, 12345, 'ADMIN');
      expect(prismaMock.service.delete).toHaveBeenCalled();
    });
  });
});
