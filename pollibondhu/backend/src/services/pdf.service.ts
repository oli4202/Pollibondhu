import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from '../patterns/singleton/Logger';

// Ensure the certificates directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/certificates');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class PdfService {
  /**
   * Generates a PDF certificate for an approved application and saves it to disk.
   * Returns the relative file URL.
   */
  public async generateCertificate(data: {
    application_id: number;
    tracking_id: string;
    service_title: string;
    applicant_name: string;
    approved_at: Date;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `certificate_${data.tracking_id}_${Date.now()}.pdf`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        const fileUrl = `/uploads/certificates/${fileName}`;

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          layout: 'landscape',
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Styling and Content
        // Border
        doc.rect(20, 20, 802, 555).stroke();
        doc.rect(25, 25, 792, 545).stroke();

        // Header
        doc.fontSize(28).font('Helvetica-Bold').text('PolliBondhu Government Services', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(18).font('Helvetica').text('Official Service Certificate', { align: 'center' });
        
        doc.moveDown(2);
        
        // Body text
        doc.fontSize(16).text('This is to certify that the service application submitted by:', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(24).font('Helvetica-Bold').text(data.applicant_name, { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(16).font('Helvetica').text('has been officially approved for the following service:', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(22).font('Helvetica-Bold').text(data.service_title, { align: 'center' });

        doc.moveDown(3);

        // Details Grid
        const detailsY = 400;
        doc.fontSize(12).font('Helvetica');
        doc.text(`Tracking ID: ${data.tracking_id}`, 100, detailsY);
        doc.text(`Application ID: ${data.application_id}`, 100, detailsY + 20);
        
        doc.text(`Date of Approval: ${data.approved_at.toLocaleDateString()}`, 550, detailsY);
        doc.text(`Authorized by: PolliBondhu Authority`, 550, detailsY + 20);

        // Seal / Signature Line
        doc.moveTo(550, detailsY + 80).lineTo(750, detailsY + 80).stroke();
        doc.text('Authorized Signature', 600, detailsY + 90);

        // Footer
        doc.fontSize(10).fillColor('gray').text(
          'This is an electronically generated certificate and does not require a physical signature.',
          50, 520, { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          logger.info(`PDF certificate generated successfully: ${filePath}`);
          resolve(fileUrl);
        });

        stream.on('error', (err) => {
          logger.error(`Error writing PDF certificate: ${err.message}`);
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const pdfService = new PdfService();
