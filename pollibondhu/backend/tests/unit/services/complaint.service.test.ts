/**
 * Unit tests — ComplaintService
 * Repository + Observer collaborators are isolated via prismaMock and a spy
 * on the appEventSubject.
 */
import { prismaMock } from '../../setup';
import { ComplaintService } from '../../../src/services/complaint.service';
import { appEventSubject } from '../../../src/patterns/observer/NotificationSubject';

const complaint = {
  complaint_id: 10,
  user_id: 5,
  assigned_to: null as number | null,
  status: 'PENDING',
};

describe('ComplaintService', () => {
  let service: ComplaintService;

  beforeEach(() => {
    service = new ComplaintService(prismaMock);
    jest.spyOn(appEventSubject, 'notify').mockResolvedValue(undefined);
  });

  describe('submitComplaint', () => {
    it('always creates the complaint in PENDING state connected to its author', async () => {
      prismaMock.complaint.create.mockResolvedValue(complaint as any);

      await service.submitComplaint({ title: 'Broken road', description: '...' }, 5);

      expect(prismaMock.complaint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Broken road',
          user: { connect: { user_id: 5 } },
          status: 'PENDING',
        }),
      });
    });
  });

  describe('updateStatus', () => {
    it('throws when the complaint does not exist', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(999, 'REVIEWING', 1, ['ADMIN']))
        .rejects.toThrow('Complaint not found');
    });

    it('blocks officers who are not assigned to the complaint', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue({ ...complaint, assigned_to: 99 } as any);
      await expect(service.updateStatus(10, 'REVIEWING', 7, ['OFFICER']))
        .rejects.toThrow('Only the assigned officer or provider can update this complaint');
    });

    it('allows the assigned officer to progress the complaint', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue({ ...complaint, assigned_to: 7 } as any);
      prismaMock.complaint.update.mockResolvedValue({ ...complaint, status: 'REVIEWING' } as any);

      const updated = await service.updateStatus(10, 'REVIEWING', 7, ['OFFICER']);

      expect(updated.status).toBe('REVIEWING');
      expect(prismaMock.complaint.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { complaint_id: 10 } })
      );
    });

    it('lets SUPER_ADMIN bypass assignment checks', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue(complaint as any);
      prismaMock.complaint.update.mockResolvedValue({ ...complaint, status: 'REVIEWING' } as any);

      await service.updateStatus(10, 'REVIEWING', 1, ['SUPER_ADMIN']);
      expect(prismaMock.complaint.update).toHaveBeenCalled();
    });

    it('requires resolution notes when resolving', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue({ ...complaint, assigned_to: 7 } as any);
      await expect(service.updateStatus(10, 'RESOLVED', 7, ['OFFICER'], '   '))
        .rejects.toThrow('Resolution notes are required when resolving or rejecting a complaint');
      expect(prismaMock.complaint.update).not.toHaveBeenCalled();
    });

    it('requires resolution notes when rejecting', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue({ ...complaint, assigned_to: 7 } as any);
      await expect(service.updateStatus(10, 'REJECTED', 7, ['OFFICER']))
        .rejects.toThrow('Resolution notes are required');
    });

    it('publishes COMPLAINT_RESOLVED when resolved', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue({ ...complaint, assigned_to: 7 } as any);
      prismaMock.complaint.update.mockResolvedValue({ ...complaint, status: 'RESOLVED' } as any);

      await service.updateStatus(10, 'RESOLVED', 7, ['OFFICER'], 'Fixed by union parishad');

      expect(appEventSubject.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'COMPLAINT_RESOLVED' }),
        prismaMock
      );
    });

    it('does not publish events for non-resolution transitions', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue({ ...complaint, assigned_to: 7 } as any);
      prismaMock.complaint.update.mockResolvedValue(complaint as any);

      await service.updateStatus(10, 'REVIEWING', 7, ['OFFICER']);
      expect(appEventSubject.notify).not.toHaveBeenCalled();
    });
  });

  describe('listComplaints / getComplaint', () => {
    it('delegates listing options straight to the repository', async () => {
      prismaMock.complaint.findMany.mockResolvedValue([]);
      prismaMock.complaint.count.mockResolvedValue(0);

      await service.listComplaints({ page: 2, limit: 20, status: 'PENDING' });
      expect(prismaMock.complaint.findMany).toHaveBeenCalled();
    });

    it('throws for a missing complaint id', async () => {
      prismaMock.complaint.findUnique.mockResolvedValue(null);
      await expect(service.getComplaint(404)).rejects.toThrow('Complaint not found');
    });
  });
});
