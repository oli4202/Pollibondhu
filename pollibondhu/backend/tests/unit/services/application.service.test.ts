/**
 * Unit tests — ApplicationService
 * All external dependencies are isolated:
 *  - Database via prismaMock (jest-mock-extended)
 *  - Observer, PDF service, and notification util mocked
 */
import { prismaMock } from '../../setup';
import { ApplicationService } from '../../../src/services/application.service';
import { appEventSubject } from '../../../src/patterns/observer/NotificationSubject';
import * as notifUtil from '../../../src/utils/notification.util';
import * as pdfServiceModule from '../../../src/services/pdf.service';

// Isolate side-effect collaborators
jest.mock('../../../src/utils/notification.util');
jest.mock('../../../src/services/pdf.service', () => ({
  pdfService: { generateCertificate: jest.fn() },
}));

const mockApp = {
  application_id: 1,
  tracking_id: 'APP-2026-0001',
  user_id: 5,
  service_id: null as number | null,
  department_id: null as number | null,
  status: 'SUBMITTED',
  applicant_name: 'Rahim',
  user: { full_name: 'Rahim' },
  service: null as any,
};

describe('ApplicationService', () => {
  let service: ApplicationService;

  beforeEach(() => {
    service = new ApplicationService(prismaMock);
    jest.spyOn(appEventSubject, 'notify').mockResolvedValue(undefined);
    (notifUtil.createAndPushNotification as jest.Mock).mockResolvedValue({});
    (pdfServiceModule.pdfService.generateCertificate as jest.Mock).mockResolvedValue('/uploads/cert.pdf');
  });

  // ─── submitApplication ──────────────────────────────────────────────────────

  describe('submitApplication', () => {
    it('creates an application with SUBMITTED status and records initial update', async () => {
      prismaMock.application.count.mockResolvedValue(0);
      prismaMock.application.create.mockResolvedValue(mockApp as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);

      const result = await service.submitApplication({ applicant_name: 'Rahim' }, 5);

      expect(prismaMock.application.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SUBMITTED',
            user: { connect: { user_id: 5 } },
          }),
        })
      );
      expect(notifUtil.createAndPushNotification).toHaveBeenCalled();
      expect(result.status).toBe('SUBMITTED');
    });

    it('notifies the specific service provider when service_id is given', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.application.create.mockResolvedValue({ ...mockApp, service_id: 10 } as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);
      prismaMock.service.findUnique.mockResolvedValue({ service_id: 10, provider_id: 99, title: 'Tractor Rental' } as any);

      await service.submitApplication({ service_id: 10 }, 5);

      expect(prismaMock.service.findUnique).toHaveBeenCalledWith({ where: { service_id: 10 } });
      // Two notifications: citizen + provider
      expect(notifUtil.createAndPushNotification).toHaveBeenCalledTimes(2);
    });

    it('notifies GOV_SERVICE_PROVIDER when no service_id is given', async () => {
      prismaMock.application.count.mockResolvedValue(0);
      prismaMock.application.create.mockResolvedValue(mockApp as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);
      prismaMock.user.findFirst.mockResolvedValue({ user_id: 77, role: 'GOV_SERVICE_PROVIDER' } as any);

      await service.submitApplication({ department_id: 3 }, 5);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'GOV_SERVICE_PROVIDER', is_active: true } })
      );
      expect(notifUtil.createAndPushNotification).toHaveBeenCalledTimes(2);
    });

    it('skips gov provider notification if none exists', async () => {
      prismaMock.application.count.mockResolvedValue(0);
      prismaMock.application.create.mockResolvedValue(mockApp as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);
      prismaMock.user.findFirst.mockResolvedValue(null);

      await service.submitApplication({}, 5);

      // Only the citizen notification fires
      expect(notifUtil.createAndPushNotification).toHaveBeenCalledTimes(1);
    });
  });

  // ─── processApplication ─────────────────────────────────────────────────────

  describe('processApplication', () => {
    it('throws when application does not exist', async () => {
      prismaMock.application.findUnique.mockResolvedValue(null);
      await expect(service.processApplication(999, 'REVIEWING', 1)).rejects.toThrow('Application not found');
    });

    it('throws on an invalid status transition', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...mockApp, status: 'APPROVED' } as any);
      await expect(service.processApplication(1, 'SUBMITTED', 1)).rejects.toThrow('Invalid status transition');
    });

    it('updates status to REVIEWING with notes', async () => {
      prismaMock.application.findUnique.mockResolvedValue(mockApp as any);
      prismaMock.application.update.mockResolvedValue({ ...mockApp, status: 'REVIEWING' } as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);

      const result = await service.processApplication(1, 'REVIEWING', 2, 'Under review');

      expect(prismaMock.application.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REVIEWING' }) })
      );
      expect(result.status).toBe('REVIEWING');
    });

    it('sets approved_at when status is APPROVED and generates PDF certificate', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...mockApp, status: 'IN_PROGRESS' } as any);
      prismaMock.application.update.mockResolvedValue({ ...mockApp, status: 'APPROVED' } as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);
      prismaMock.applicationDocument.create.mockResolvedValue({} as any);

      await service.processApplication(1, 'APPROVED', 2);

      expect(pdfServiceModule.pdfService.generateCertificate).toHaveBeenCalled();
      expect(prismaMock.applicationDocument.create).toHaveBeenCalled();
      expect(appEventSubject.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'APPLICATION_APPROVED' }),
        prismaMock
      );
    });

    it('handles PDF generation failure gracefully (does not throw)', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...mockApp, status: 'IN_PROGRESS' } as any);
      prismaMock.application.update.mockResolvedValue({ ...mockApp, status: 'APPROVED' } as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);
      (pdfServiceModule.pdfService.generateCertificate as jest.Mock).mockRejectedValue(new Error('PDF error'));

      await expect(service.processApplication(1, 'APPROVED', 2)).resolves.toBeDefined();
    });

    it('does not trigger budget deduction when status is not RESOLVED', async () => {
      const appWithService = { ...mockApp, status: 'APPROVED', service_id: 10 };
      prismaMock.application.findUnique.mockResolvedValue(appWithService as any);
      prismaMock.application.update.mockResolvedValue({ ...appWithService, status: 'CLOSED' } as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);

      await service.processApplication(1, 'CLOSED', 2);

      // Budget deduction only occurs when status === 'RESOLVED'; CLOSED does not trigger it
      expect(prismaMock.project.update).not.toHaveBeenCalled();
    });

    it('sends status-specific notification to citizen', async () => {
      prismaMock.application.findUnique.mockResolvedValue(mockApp as any);
      prismaMock.application.update.mockResolvedValue({ ...mockApp, status: 'REJECTED' } as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);

      await service.processApplication(1, 'REJECTED', 2, undefined, 'Incomplete docs');

      expect(notifUtil.createAndPushNotification).toHaveBeenCalledWith(
        mockApp.user_id,
        'APPLICATION',
        expect.any(String),
        expect.stringContaining('rejected')
      );
    });
  });

  // ─── getApplication ─────────────────────────────────────────────────────────

  describe('getApplication', () => {
    it('returns the application when found', async () => {
      prismaMock.application.findUnique.mockResolvedValue(mockApp as any);
      const result = await service.getApplication(1);
      expect(result.tracking_id).toBe('APP-2026-0001');
    });

    it('throws when not found', async () => {
      prismaMock.application.findUnique.mockResolvedValue(null);
      await expect(service.getApplication(999)).rejects.toThrow('Application not found');
    });
  });

  // ─── getApplicationByTrackingId ─────────────────────────────────────────────

  describe('getApplicationByTrackingId', () => {
    it('returns app when found by tracking id', async () => {
      prismaMock.application.findUnique.mockResolvedValue(mockApp as any);
      const result = await service.getApplicationByTrackingId('APP-2026-0001');
      expect(result.application_id).toBe(1);
    });

    it('throws when tracking id not found', async () => {
      prismaMock.application.findUnique.mockResolvedValue(null);
      await expect(service.getApplicationByTrackingId('INVALID')).rejects.toThrow('Application not found');
    });
  });

  // ─── listApplications ───────────────────────────────────────────────────────

  describe('listApplications', () => {
    it('delegates to repository with provided options', async () => {
      prismaMock.application.findMany.mockResolvedValue([]);
      prismaMock.application.count.mockResolvedValue(0);

      const result = await service.listApplications({ page: 1, limit: 5, status: 'SUBMITTED' });
      expect(prismaMock.application.findMany).toHaveBeenCalled();
      expect(result.total).toBe(0);
    });
  });

  // ─── uploadDocument ─────────────────────────────────────────────────────────

  describe('uploadDocument', () => {
    it('throws when application not found', async () => {
      prismaMock.application.findUnique.mockResolvedValue(null);
      await expect(service.uploadDocument(999, 5, { doc_type: 'NID', file_name: 'nid.jpg', file_url: '/url' }))
        .rejects.toThrow('Application not found');
    });

    it('adds document when application exists', async () => {
      prismaMock.application.findUnique.mockResolvedValue(mockApp as any);
      prismaMock.applicationDocument.create.mockResolvedValue({ doc_id: 1 } as any);

      const result = await service.uploadDocument(1, 5, { doc_type: 'NID', file_name: 'nid.jpg', file_url: '/url' });

      expect(prismaMock.applicationDocument.create).toHaveBeenCalled();
    });
  });

  // ─── getTimeline ────────────────────────────────────────────────────────────

  describe('getTimeline', () => {
    it('returns ordered updates for an application', async () => {
      prismaMock.applicationUpdate.findMany.mockResolvedValue([{ update_id: 1 }] as any);
      const result = await service.getTimeline(1);
      expect(result).toHaveLength(1);
      expect(prismaMock.applicationUpdate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { application_id: 1 } })
      );
    });
  });

  // ─── provideFeedback ────────────────────────────────────────────────────────

  describe('provideFeedback', () => {
    it('throws when application not found', async () => {
      prismaMock.application.findUnique.mockResolvedValue(null);
      await expect(service.provideFeedback(999, 5, 5)).rejects.toThrow('Application not found');
    });

    it('throws when user is not the owner', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...mockApp, user_id: 99, status: 'APPROVED' } as any);
      await expect(service.provideFeedback(1, 5, 5)).rejects.toThrow('Unauthorized');
    });

    it('throws when status is not APPROVED or CLOSED', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...mockApp, user_id: 5, status: 'SUBMITTED' } as any);
      await expect(service.provideFeedback(1, 5, 5)).rejects.toThrow('Feedback can only be provided on completed applications');
    });

    it('records feedback and closes the application', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...mockApp, user_id: 5, status: 'APPROVED' } as any);
      prismaMock.application.update.mockResolvedValue({ ...mockApp, status: 'CLOSED' } as any);

      const result = await service.provideFeedback(1, 5, 4, 'Great service!');

      expect(prismaMock.application.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ citizen_rating: 4, status: 'CLOSED' }) })
      );
    });
  });

  // ─── resubmitApplication ────────────────────────────────────────────────────

  describe('resubmitApplication', () => {
    it('throws when application not found', async () => {
      prismaMock.application.findUnique.mockResolvedValue(null);
      await expect(service.resubmitApplication(999, 5, 'Here are the docs')).rejects.toThrow('Application not found');
    });

    it('throws when user is not the owner', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...mockApp, user_id: 99 } as any);
      await expect(service.resubmitApplication(1, 5, 'docs')).rejects.toThrow('Unauthorized');
    });

    it('throws when application is not in ADDITIONAL_DOCS_REQUIRED state', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...mockApp, user_id: 5, status: 'SUBMITTED' } as any);
      await expect(service.resubmitApplication(1, 5, 'docs')).rejects.toThrow('not waiting for additional documents');
    });

    it('resubmits and records update', async () => {
      prismaMock.application.findUnique.mockResolvedValue({
        ...mockApp, user_id: 5, status: 'ADDITIONAL_DOCS_REQUIRED',
      } as any);
      prismaMock.application.update.mockResolvedValue({ ...mockApp, status: 'RESUBMITTED' } as any);
      prismaMock.applicationUpdate.create.mockResolvedValue({} as any);

      const result = await service.resubmitApplication(1, 5, 'Here are additional docs');

      expect(prismaMock.application.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'RESUBMITTED' } })
      );
      expect(prismaMock.applicationUpdate.create).toHaveBeenCalled();
    });
  });
});
