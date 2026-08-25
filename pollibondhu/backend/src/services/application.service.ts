import { PrismaClient } from '@prisma/client';
import { ApplicationRepository } from '../repositories/application.repository';
import { appEventSubject } from '../patterns/observer/NotificationSubject';
import { logger } from '../patterns/singleton/Logger';

/** Valid status transitions */
const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['REVIEWING', 'REJECTED'],
  REVIEWING: ['ADDITIONAL_DOCS_REQUIRED', 'IN_PROGRESS', 'REJECTED'],
  ADDITIONAL_DOCS_REQUIRED: ['RESUBMITTED'],
  RESUBMITTED: ['REVIEWING'],
  IN_PROGRESS: ['APPROVED', 'REJECTED'],
  APPROVED: ['CLOSED'],
  REJECTED: ['CLOSED'],
  CLOSED: [],
};

export class ApplicationService {
  private repo: ApplicationRepository;

  constructor(private prisma: PrismaClient) {
    this.repo = new ApplicationRepository(prisma);
  }

  /**
   * Citizen submits a new application
   */
  async submitApplication(data: {
    service_id?: number;
    category_id?: number;
    department_id?: number;
    applicant_name?: string;
    applicant_data?: string;
  }, user_id: number) {
    logger.info(`User ${user_id} submitting application`);

    const tracking_id = await this.repo.generateTrackingId();

    const application = await this.repo.create({
      tracking_id,
      user: { connect: { user_id } },
      service: data.service_id ? { connect: { service_id: data.service_id } } : undefined,
      department: data.department_id ? { connect: { department_id: data.department_id } } : undefined,
      applicant_name: data.applicant_name,
      applicant_data: data.applicant_data,
      status: 'SUBMITTED',
      priority: 'NORMAL',
    });

    // Record the initial update
    await this.repo.addUpdate(application.application_id, {
      user_id,
      new_status: 'SUBMITTED',
      notes: 'Application submitted',
    });

    // Create notification for citizen
    await this.prisma.notification.create({
      data: {
        user_id,
        type: 'IN_APP',
        title: 'Application Submitted',
        message: `Your application ${tracking_id} has been submitted successfully.`,
      },
    });

    return application;
  }

  /**
   * Officer/admin processes an application
   */
  async processApplication(
    application_id: number,
    status: string,
    officer_id: number,
    notes?: string,
    rejection_reason?: string
  ) {
    logger.info(`Officer ${officer_id} processing application ${application_id} → ${status}`);

    const existing = await this.repo.findById(application_id);
    if (!existing) throw new Error('Application not found');

    // Validate status transition
    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid status transition: ${existing.status} → ${status}`);
    }

    const updateData: any = {
      status,
      reviewed_by: officer_id,
      reviewed_at: new Date(),
    };

    if (notes) updateData.notes = notes;
    if (rejection_reason) updateData.rejection_reason = rejection_reason;
    if (status === 'APPROVED') updateData.approved_at = new Date();
    if (status === 'RESOLVED') updateData.resolved_at = new Date();

    const updated = await this.repo.update(application_id, updateData);

    // Record the status change
    await this.repo.addUpdate(application_id, {
      user_id: officer_id,
      old_status: existing.status,
      new_status: status,
      notes: notes || rejection_reason,
    });

    // Send notification to citizen
    const statusMessages: Record<string, string> = {
      REVIEWING: 'is being reviewed',
      ADDITIONAL_DOCS_REQUIRED: 'requires additional documents',
      IN_PROGRESS: 'is now being processed',
      APPROVED: 'has been approved! 🎉',
      REJECTED: 'has been rejected',
      CLOSED: 'has been closed',
    };

    if (statusMessages[status]) {
      await this.prisma.notification.create({
        data: {
          user_id: existing.user_id,
          type: 'IN_APP',
          title: `Application ${status.replace(/_/g, ' ').toLowerCase()}`,
          message: `Your application ${existing.tracking_id} ${statusMessages[status]}.`,
        },
      });
    }

    // Trigger observer for approved applications
    if (status === 'APPROVED') {
      await appEventSubject.notify({
        type: 'APPLICATION_APPROVED',
        payload: {
          user_id: existing.user_id,
          application_id: existing.application_id,
          tracking_id: existing.tracking_id,
          officer_id,
          entity_type: 'APPLICATION',
          entity_id: application_id,
        },
        timestamp: new Date(),
      }, this.prisma);
    }

    return updated;
  }

  /**
   * Get application with full details
   */
  async getApplication(application_id: number) {
    const app = await this.repo.findById(application_id);
    if (!app) throw new Error('Application not found');
    return app;
  }

  /**
   * Get application by tracking ID
   */
  async getApplicationByTrackingId(tracking_id: string) {
    const app = await this.repo.findByTrackingId(tracking_id);
    if (!app) throw new Error('Application not found');
    return app;
  }

  /**
   * List applications with filtering
   */
  async listApplications(options: {
    page: number;
    limit: number;
    status?: string;
    user_id?: number;
    service_id?: number;
    department_id?: number;
  }) {
    return this.repo.findAll(options);
  }

  /**
   * Upload a document for an application
   */
  async uploadDocument(
    application_id: number,
    user_id: number,
    doc: { doc_type: string; file_name: string; file_url: string; file_size?: number; mime_type?: string }
  ) {
    logger.info(`User ${user_id} uploading document for application ${application_id}`);

    const application = await this.repo.findById(application_id);
    if (!application) throw new Error('Application not found');

    return this.repo.addDocument({
      application: { connect: { application_id } },
      user: { connect: { user_id } },
      doc_type: doc.doc_type,
      file_name: doc.file_name,
      file_url: doc.file_url,
      file_size: doc.file_size || undefined,
      mime_type: doc.mime_type || undefined,
    });
  }

  /**
   * Get application timeline
   */
  async getTimeline(application_id: number) {
    return this.prisma.applicationUpdate.findMany({
      where: { application_id },
      orderBy: { created_at: 'desc' },
      include: { user: { select: { full_name: true, role: true } } },
    });
  }

  /**
   * Citizen provides feedback on completed application
   */
  async provideFeedback(application_id: number, user_id: number, rating: number, feedback?: string) {
    const app = await this.repo.findById(application_id);
    if (!app) throw new Error('Application not found');
    if (app.user_id !== user_id) throw new Error('Unauthorized');
    if (app.status !== 'APPROVED' && app.status !== 'CLOSED') {
      throw new Error('Feedback can only be provided on completed applications');
    }

    return this.repo.update(application_id, {
      citizen_rating: rating,
      citizen_feedback: feedback,
      status: 'CLOSED',
    });
  }
}
