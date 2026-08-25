import { PrismaClient } from '@prisma/client';
import { EducationRepository } from '../repositories/education.repository';
import { logger } from '../patterns/singleton/Logger';

export class EducationService {
  private repo: EducationRepository;

  constructor(private prisma: PrismaClient) {
    this.repo = new EducationRepository(prisma);
  }

  async listInstitutions(options: { page: number; limit: number; type?: string; district?: string; search?: string }) {
    return this.repo.listInstitutions(options);
  }

  async getInstitution(institution_id: number) {
    const inst = await this.repo.findInstitution(institution_id);
    if (!inst) throw new Error('Institution not found');
    return inst;
  }

  async createInstitution(data: any) {
    logger.info(`Creating institution: ${data.name}`);
    return this.repo.createInstitution(data);
  }

  async updateInstitution(institution_id: number, data: any) {
    logger.info(`Updating institution ${institution_id}`);
    return this.repo.updateInstitution(institution_id, data);
  }

  async listCourses(institution_id: number) {
    return this.repo.listCourses(institution_id);
  }

  async createCourse(data: any) {
    logger.info(`Creating course: ${data.name}`);
    return this.repo.createCourse(data);
  }

  async enrollStudent(course_id: number, user_id: number) {
    logger.info(`User ${user_id} enrolling in course ${course_id}`);
    return this.repo.enrollStudent(course_id, user_id);
  }

  async listAnnouncements(institution_id: number) {
    return this.repo.listAnnouncements(institution_id);
  }

  async createAnnouncement(data: any) {
    return this.repo.createAnnouncement(data);
  }
}
