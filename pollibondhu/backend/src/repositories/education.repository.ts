import { PrismaClient, Prisma } from '@prisma/client';

export class EducationRepository {
  constructor(private prisma: PrismaClient) {}

  // Institutions
  async findInstitution(institution_id: number) {
    return this.prisma.institution.findUnique({
      where: { institution_id },
      include: {
        courses: { where: { is_active: true } },
        students: { include: { user: { select: { full_name: true } } } },
        announcements: { where: { is_active: true }, orderBy: { created_at: 'desc' } },
      },
    });
  }

  async listInstitutions(options: { page: number; limit: number; type?: string; district?: string; search?: string }) {
    const { page, limit, type, district, search } = options;
    const where: Prisma.InstitutionWhereInput = { is_active: true };
    if (type) where.type = type;
    if (district) where.district = district;
    if (search) where.OR = [{ name: { contains: search } }, { name_bn: { contains: search } }];

    const [data, total] = await Promise.all([
      this.prisma.institution.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { courses: true, students: true } } },
      }),
      this.prisma.institution.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createInstitution(data: Prisma.InstitutionCreateInput) {
    return this.prisma.institution.create({ data });
  }

  async updateInstitution(institution_id: number, data: Prisma.InstitutionUpdateInput) {
    return this.prisma.institution.update({ where: { institution_id }, data });
  }

  // Courses
  async listCourses(institution_id: number) {
    return this.prisma.course.findMany({
      where: { institution_id, is_active: true },
      include: {
        teachers: { include: { user: { select: { full_name: true } } } },
        _count: { select: { students: true } },
      },
    });
  }

  async createCourse(data: Prisma.CourseCreateInput) {
    return this.prisma.course.create({ data });
  }

  async enrollStudent(course_id: number, user_id: number) {
    // Find or create student record
    let student = await this.prisma.student.findUnique({ where: { user_id } });
    if (!student) {
      const course = await this.prisma.course.findUnique({ where: { course_id }, select: { institution_id: true } });
      if (!course) throw new Error('Course not found');
      student = await this.prisma.student.create({
        data: { user_id, institution_id: course.institution_id },
      });
    }
    // Connect student to course
    return this.prisma.course.update({
      where: { course_id },
      data: { students: { connect: { student_id: student.student_id } } },
    });
  }

  // Announcements
  async listAnnouncements(institution_id: number) {
    return this.prisma.institutionAnnouncement.findMany({
      where: { institution_id, is_active: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async createAnnouncement(data: Prisma.InstitutionAnnouncementCreateInput) {
    return this.prisma.institutionAnnouncement.create({ data });
  }
}
