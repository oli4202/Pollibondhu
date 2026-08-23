import { PrismaClient } from '@prisma/client';
import { ComplaintRepository } from '../repositories/complaint.repository';
import { appEventSubject } from '../patterns/observer/NotificationSubject';
import { logger } from '../patterns/singleton/Logger';

export class ComplaintService {
  private repo: ComplaintRepository;

  constructor(private prisma: PrismaClient) {
    this.repo = new ComplaintRepository(prisma);
  }

  async submitComplaint(data: any, user_id: number) {
    logger.info(`User ${user_id} submitting complaint`);
    return this.repo.create({
      ...data,
      user: { connect: { user_id } },
      status: 'PENDING',
    });
  }

  async updateStatus(complaint_id: number, status: string, admin_id: number, notes?: string) {
    logger.info(`Admin ${admin_id} updating complaint ${complaint_id} to ${status}`);
    const complaint = await this.repo.update(complaint_id, {
      status: status as any,
      reviewed_by: admin_id,
      resolution_notes: notes,
      resolved_at: status === 'RESOLVED' ? new Date() : undefined,
    });

    if (status === 'RESOLVED') {
      await appEventSubject.notify({
        type: 'COMPLAINT_RESOLVED',
        payload: { user_id: complaint.user_id, complaint_id: complaint.complaint_id, admin_id, entity_type: 'COMPLAINT', entity_id: complaint_id },
        timestamp: new Date(),
      }, this.prisma);
    }

    return complaint;
  }

  async listComplaints(options: any) {
    return this.repo.findAll(options);
  }

  async getComplaint(complaint_id: number) {
    const complaint = await this.repo.findById(complaint_id);
    if (!complaint) throw new Error('Complaint not found');
    return complaint;
  }
}
