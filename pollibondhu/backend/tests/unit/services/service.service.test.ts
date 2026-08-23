import { ServiceService } from '../../../src/services/service.service';
import { mockService, mockUser, mockProvider } from '../../mocks/data.mock';
import { prismaMock } from '../../setup';

describe('ServiceService', () => {
  let serviceService: ServiceService;

  beforeEach(() => {
    serviceService = new ServiceService(prismaMock as any);
  });

  describe('createService', () => {
    it('should create service with PENDING status', async () => {
      prismaMock.service.create.mockResolvedValue(mockService as any);

      const result = await serviceService.createService({ title: 'Test' }, 3);

      expect(result.status).toBe('PENDING');
      expect(prismaMock.service.create).toHaveBeenCalled();
    });
  });

  describe('approveService', () => {
    it('should approve service and trigger observer notification', async () => {
      prismaMock.service.update.mockResolvedValue({ ...mockService, status: 'APPROVED' } as any);
      prismaMock.notification.create.mockResolvedValue({} as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await serviceService.approveService(1, 2);

      expect(result.status).toBe('APPROVED');
      expect(prismaMock.notification.create).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('updateService', () => {
    it('should allow admin to update any service', async () => {
      prismaMock.service.findUnique.mockResolvedValue(mockService as any);
      prismaMock.service.update.mockResolvedValue(mockService as any);

      const result = await serviceService.updateService(1, { title: 'Updated' }, 2, 'ADMIN');
      expect(result).toBeDefined();
    });

    it('should allow provider to update own service', async () => {
      prismaMock.service.findUnique.mockResolvedValue(mockService as any);
      prismaMock.service.update.mockResolvedValue(mockService as any);

      const result = await serviceService.updateService(1, { title: 'Updated' }, 3, 'PROVIDER');
      expect(result).toBeDefined();
    });

    it('should reject unauthorized update', async () => {
      prismaMock.service.findUnique.mockResolvedValue(mockService as any);

      await expect(
        serviceService.updateService(1, { title: 'Updated' }, 99, 'USER')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteService', () => {
    it('should reject unauthorized delete', async () => {
      prismaMock.service.findUnique.mockResolvedValue(mockService as any);

      await expect(serviceService.deleteService(1, 99, 'USER')).rejects.toThrow('Unauthorized');
    });
  });
});
