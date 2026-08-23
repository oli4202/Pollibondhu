import { ComplaintService } from '../../../src/services/complaint.service';
import { mockComplaint } from '../../mocks/data.mock';
import { prismaMock } from '../../setup';

describe('ComplaintService', () => {
  let complaintService: ComplaintService;

  beforeEach(() => {
    complaintService = new ComplaintService(prismaMock as any);
  });

  describe('submitComplaint', () => {
    it('should create complaint with PENDING status', async () => {
      prismaMock.complaint.create.mockResolvedValue(mockComplaint as any);

      const result = await complaintService.submitComplaint(
        { category: 'Infra', subject: 'Road', description: 'Bad road' },
        1
      );

      expect(result.status).toBe('PENDING');
    });
  });

  describe('updateStatus', () => {
    it('should update status and notify on RESOLVED', async () => {
      prismaMock.complaint.update.mockResolvedValue({ ...mockComplaint, status: 'RESOLVED' } as any);
      prismaMock.notification.create.mockResolvedValue({} as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await complaintService.updateStatus(1, 'RESOLVED', 2, 'Fixed');

      expect(result.status).toBe('RESOLVED');
      expect(prismaMock.notification.create).toHaveBeenCalled();
    });

    it('should update status without notification for REVIEWING', async () => {
      prismaMock.complaint.update.mockResolvedValue({ ...mockComplaint, status: 'REVIEWING' } as any);

      const result = await complaintService.updateStatus(1, 'REVIEWING', 2);

      expect(result.status).toBe('REVIEWING');
    });
  });
});
