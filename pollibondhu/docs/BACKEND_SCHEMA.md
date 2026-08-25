# Backend Schema (BACKEND_SCHEMA.md)
## PolliBondhu — PostgreSQL/Prisma Database Schema

**Version:** 2.0  
**Date:** August 2026  
**Engine:** PostgreSQL 15+  
**ORM:** Prisma 5.x  

---

## 1. Schema Design Principles

1. **Normalized**: 3NF minimum, avoid redundancy
2. **snake_case**: All table and column names
3. **Primary Keys**: Auto-incrementing integers (`@id @default(autoincrement())`)
4. **Timestamps**: `created_at DateTime @default(now())`, `updated_at DateTime @updatedAt`
5. **Soft Deletion**: `deleted_at DateTime?` where appropriate
6. **Status Enums**: String-based with validation at application level
7. **Foreign Keys**: Explicit with proper referential actions
8. **Indexes**: On frequently queried columns (foreign keys, status, search fields)

---

## 2. Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        RBAC CORE                                │
│  users ──┬── user_roles ── roles ── role_permissions            │
│          │                          permissions                  │
│          ├── user_departments ── departments                     │
│          └── user_locations ── locations                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE & APPLICATION                         │
│  service_categories ── services ── applications ── app_docs     │
│                        applications ── application_updates       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    COMPLAINTS & ACCOUNTABILITY                   │
│  complaints ── complaint_updates ── departments                  │
│  projects ── project_updates ── departments ── project_budgets  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    AGRICULTURE ECOSYSTEM                        │
│  crops ── market_prices                                         │
│  crops ── crop_advices ── experts ── users                      │
│  weather_data ── crop_advices                                   │
│  soil_test_requests ── users                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EDUCATION                                    │
│  institutions ── courses ── course_teachers ── users            │
│  institutions ── students ── users                              │
│  institution_announcements                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    NGOs & SOCIAL SUPPORT                        │
│  organisations ── ngo_programmes ── programme_enrolments        │
│  food_support ── donations                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGING & NOTIFICATIONS                    │
│  conversations ── conversation_members ── messages              │
│  messages ── message_attachments                                │
│  notifications                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WASTE, EMERGENCY, EVENTS, NEWS               │
│  waste_reports ── waste_zones                                   │
│  emergency_contacts                                             │
│  events ── event_attendees                                      │
│  news_articles                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    COMMON / CROSS-CUTTING                       │
│  audit_logs ── users                                            │
│  refresh_tokens ── users                                        │
│  payments                                                       │
│  saved_items                                                    │
│  user_activities                                                │
│  polls ── votes ── users                                        │
│  certificates ── users                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Tables

### 3.1 Users & Authentication

```prisma
model User {
  user_id       Int      @id @default(autoincrement())
  email         String   @unique
  password_hash String
  phone         String?  @unique
  nid           String?  @unique
  full_name     String
  avatar_url    String?
  
  // Location hierarchy
  division      String?
  district      String?
  upazila       String?
  union_name    String?
  village       String?
  
  is_active     Boolean  @default(true)
  email_verified Boolean @default(false)
  phone_verified Boolean @default(false)
  
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  deleted_at    DateTime?

  // RBAC relationships
  user_roles           UserRole[]
  user_departments     UserDepartment[]
  user_locations       UserLocation[]
  
  // Application relationships
  applications         Application[]
  application_documents ApplicationDocument[]
  
  // Complaint relationships
  complaints           Complaint[]        @relation("ComplaintCitizen")
  assigned_complaints  Complaint[]        @relation("ComplaintAssignee")
  reviewed_complaints  Complaint[]        @relation("ComplaintReviewer")
  complaint_updates    ComplaintUpdate[]
  
  // Messaging
  sent_messages        Message[]          @relation("MessageSender")
  received_messages    Message[]          @relation("MessageReceiver")
  conversation_members ConversationMember[]
  
  // Notifications
  notifications        Notification[]
  
  // Projects
  assigned_projects    Project[]
  
  // Services
  provided_services    Service[]
  saved_items          SavedItem[]
  
  // Agriculture
  expert_profile       Expert?
  crop_advices         CropAdvice[]
  soil_test_requests   SoilTestRequest[]
  weather_updates      Weather[]          @relation("WeatherUpdater")
  
  // Education
  teaching_courses     CourseTeacher[]
  student_profile      Student?
  
  // NGOs
  organisation_members OrganisationMember[]
  
  // Audit
  audit_logs           AuditLog[]
  refresh_tokens       RefreshToken[]
  user_activities      UserActivity[]
  
  // Other
  certificates         Certificate[]
  votes                Vote[]
  forum_posts          ForumPost[]
  payments             Payment[]
  event_attendees      EventAttendee[]
  
  @@map("users")
}

model RefreshToken {
  token_id   Int      @id @default(autoincrement())
  user_id    Int
  token      String   @unique
  expires_at DateTime
  created_at DateTime @default(now())
  revoked_at DateTime?

  user User @relation(fields: [user_id], references: [user_id], onDelete: Cascade)

  @@map("refresh_tokens")
}
```

### 3.2 RBAC Tables

```prisma
model Role {
  role_id      Int      @id @default(autoincrement())
  name         String   @unique  // SUPER_ADMIN, SUB_ADMIN, OFFICER, SERVICE_PROVIDER, NGO_ADMIN, INSTITUTION_ADMIN, TEACHER, CITIZEN
  description  String?
  is_system    Boolean  @default(false) // System roles cannot be deleted
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  role_permissions RolePermission[]
  user_roles       UserRole[]

  @@map("roles")
}

model Permission {
  permission_id Int      @id @default(autoincrement())
  name          String   @unique  // e.g., "user.view", "complaint.create", "project.approve"
  module        String   // e.g., "user", "complaint", "project", "service"
  description   String?
  created_at    DateTime @default(now())

  role_permissions RolePermission[]

  @@map("permissions")
}

model RolePermission {
  id           Int      @id @default(autoincrement())
  role_id      Int
  permission_id Int
  
  role       Role       @relation(fields: [role_id], references: [role_id], onDelete: Cascade)
  permission Permission @relation(fields: [permission_id], references: [permission_id], onDelete: Cascade)

  @@unique([role_id, permission_id])
  @@map("role_permissions")
}

model UserRole {
  id      Int @id @default(autoincrement())
  user_id Int
  role_id Int

  user User @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  role Role @relation(fields: [role_id], references: [role_id], onDelete: Cascade)

  @@unique([user_id, role_id])
  @@map("user_roles")
}

model Department {
  department_id Int      @id @default(autoincrement())
  name          String   @unique
  description   String?
  is_active     Boolean  @default(true)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  user_departments UserDepartment[]
  services         Service[]
  complaints       Complaint[]
  projects         Project[]
  messages         Message[]
  conversations    Conversation[]

  @@map("departments")
}

model UserDepartment {
  id            Int  @id @default(autoincrement())
  user_id       Int
  department_id Int
  
  user       User       @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  department Department @relation(fields: [department_id], references: [department_id], onDelete: Cascade)

  @@unique([user_id, department_id])
  @@map("user_departments")
}

model Location {
  location_id  Int      @id @default(autoincrement())
  name         String
  type         String   // DIVISION, DISTRICT, UPAZILA, UNION, VILLAGE
  parent_id    Int?
  division     String?
  district     String?
  upazila      String?
  union_name   String?
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())

  parent       Location?  @relation("LocationHierarchy", fields: [parent_id], references: [location_id])
  children     Location[] @relation("LocationHierarchy")
  user_locations UserLocation[]

  @@map("locations")
}

model UserLocation {
  id          Int  @id @default(autoincrement())
  user_id     Int
  location_id Int

  user     User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  location Location @relation(fields: [location_id], references: [location_id], onDelete: Cascade)

  @@unique([user_id, location_id])
  @@map("user_locations")
}
```

### 3.3 Services & Applications

```prisma
model ServiceCategory {
  category_id  Int      @id @default(autoincrement())
  name         String   @unique
  name_bn      String?
  type         String   // GOVERNMENT, AGRICULTURE, HEALTH, EDUCATION, NGO, UTILITY, OTHER
  icon         String?
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  services     Service[]
  applications Application[]

  @@map("service_categories")
}

model Service {
  service_id      Int      @id @default(autoincrement())
  category_id     Int?
  department_id   Int?
  provider_id     Int?     // User who provides this service
  
  name            String
  name_bn         String?
  description     String?
  short_desc      String?
  
  eligibility     String?  // JSON: who can apply
  required_docs   String?  // JSON: list of required documents
  fee             Decimal? @default(0)
  processing_time String?  // e.g., "5-7 days"
  
  status          String   @default("ACTIVE") // ACTIVE, INACTIVE, PENDING
  is_public       Boolean  @default(true)
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?

  category     ServiceCategory? @relation(fields: [category_id], references: [category_id])
  department   Department?      @relation(fields: [department_id], references: [department_id])
  applications Application[]
  saved_items  SavedItem[]

  @@map("services")
}

model Application {
  application_id  Int      @id @default(autoincrement())
  tracking_id     String   @unique  // APP-2024-XXXX
  user_id         Int
  service_id      Int?
  category_id     Int?
  
  status          String   @default("SUBMITTED") // SUBMITTED, REVIEWING, ADDITIONAL_DOCS_REQUIRED, RESUBMITTED, PROCESSING, APPROVED, REJECTED, CLOSED
  priority        String   @default("NORMAL") // LOW, NORMAL, HIGH, URGENT
  
  // Application data
  applicant_name  String?
  applicant_data  String?  // JSON: form data
  
  submitted_at    DateTime @default(now())
  reviewed_at     DateTime?
  reviewed_by     Int?
  approved_at     DateTime?
  deadline        DateTime?
  resolved_at     DateTime?
  
  notes           String?  // Internal notes
  rejection_reason String?
  citizen_feedback String?
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  user         User?              @relation(fields: [user_id], references: [user_id])
  service      Service?           @relation(fields: [service_id], references: [service_id])
  category     ServiceCategory?   @relation(fields: [category_id], references: [category_id])
  documents    ApplicationDocument[]
  updates      ApplicationUpdate[]

  @@index([user_id])
  @@index([status])
  @@index([service_id])
  @@map("applications")
}

model ApplicationDocument {
  doc_id        Int      @id @default(autoincrement())
  application_id Int
  user_id       Int
  
  doc_type      String   // NID, BIRTH_CERT, PHOTO, SIGNATURE, OTHER
  file_name     String
  file_url      String
  file_size     Int?
  mime_type     String?
  
  status        String   @default("PENDING") // PENDING, VERIFIED, REJECTED
  verified_by   Int?
  verified_at   DateTime?
  
  created_at    DateTime @default(now())

  application Application @relation(fields: [application_id], references: [application_id], onDelete: Cascade)
  user        User        @relation(fields: [user_id], references: [user_id])

  @@map("application_documents")
}

model ApplicationUpdate {
  update_id      Int      @id @default(autoincrement())
  application_id Int
  user_id        Int?     // Officer who made the update
  
  old_status     String?
  new_status     String?
  notes          String?
  is_internal    Boolean  @default(false) // Internal note vs citizen-visible
  
  created_at     DateTime @default(now())

  application Application @relation(fields: [application_id], references: [application_id], onDelete: Cascade)
  user        User?       @relation(fields: [user_id], references: [user_id])

  @@map("application_updates")
}
```

### 3.4 Complaints

```prisma
model Complaint {
  complaint_id     Int       @id @default(autoincrement())
  tracking_id      String    @unique // COMP-2024-XXXX
  user_id          Int
  category         String    // INFRASTRUCTURE, HEALTH, AGRICULTURE, EDUCATION, WATER, ELECTRICITY, WASTE, OTHER
  department_id    Int?
  
  subject          String
  description      String
  location         String?
  latitude         Float?
  longitude        Float?
  
  photo_url        String?   // Primary photo
  priority         String    @default("MEDIUM") // LOW, MEDIUM, HIGH, CRITICAL
  status           String    @default("SUBMITTED") // SUBMITTED, REVIEWING, ASSIGNED, IN_PROGRESS, RESOLVED, CITIZEN_VERIFICATION, CLOSED, REOPENED
  
  assigned_to      Int?
  reviewed_by      Int?
  deadline         DateTime?
  
  submitted_at     DateTime  @default(now())
  reviewed_at      DateTime?
  assigned_at      DateTime?
  resolved_at      DateTime?
  closed_at        DateTime?
  
  resolution_notes String?
  citizen_feedback String?
  citizen_rating   Int?      // 1-5 rating
  
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  user       User?            @relation("ComplaintCitizen", fields: [user_id], references: [user_id])
  assignee   User?            @relation("ComplaintAssignee", fields: [assigned_to], references: [user_id])
  reviewer   User?            @relation("ComplaintReviewer", fields: [reviewed_by], references: [user_id])
  department Department?      @relation(fields: [department_id], references: [department_id])
  updates    ComplaintUpdate[]
  documents  ComplaintDocument[]
  messages   Message[]        @relation("ComplaintMessages")

  @@index([user_id])
  @@index([status])
  @@index([category])
  @@index([department_id])
  @@map("complaints")
}

model ComplaintUpdate {
  update_id     Int      @id @default(autoincrement())
  complaint_id  Int
  user_id       Int?     // Officer who made update
  
  old_status    String?
  new_status    String?
  notes         String?
  is_internal   Boolean  @default(false)
  
  created_at    DateTime @default(now())

  complaint Complaint @relation(fields: [complaint_id], references: [complaint_id], onDelete: Cascade)
  user      User?     @relation(fields: [user_id], references: [user_id])

  @@map("complaint_updates")
}

model ComplaintDocument {
  doc_id        Int      @id @default(autoincrement())
  complaint_id  Int
  user_id       Int
  
  file_name     String
  file_url      String
  file_size     Int?
  mime_type     String?
  
  created_at    DateTime @default(now())

  complaint Complaint @relation(fields: [complaint_id], references: [complaint_id], onDelete: Cascade)
  user      User      @relation(fields: [user_id], references: [user_id])

  @@map("complaint_documents")
}
```

### 3.5 Agriculture

```prisma
model Crop {
  crop_id     Int      @id @default(autoincrement())
  name        String
  name_bn     String?
  season      String?  // RABI, KHARIF, ZAID
  category_id Int?
  image_url   String?
  description String?
  created_at  DateTime @default(now())

  market_prices MarketPrice[]
  crop_advices  CropAdvice[]
  category      Category?    @relation(fields: [category_id], references: [category_id])

  @@map("crops")
}

model MarketPrice {
  price_id    Int      @id @default(autoincrement())
  crop_id     Int
  market_name String
  district    String?
  price       Decimal
  unit        String   @default("kg")
  change_pct  Float    @default(0)
  recorded_at DateTime @default(now())

  crop Crop @relation(fields: [crop_id], references: [crop_id], onDelete: Cascade)

  @@index([crop_id])
  @@index([recorded_at])
  @@map("market_prices")
}

model Weather {
  weather_id    Int      @id @default(autoincrement())
  district      String
  temperature   Float?
  condition     String?
  humidity      Int?
  rainfall      Float?
  uv_index      String?
  forecast_date DateTime @default(now())
  updated_by    Int?
  created_at    DateTime @default(now())

  crop_advices     CropAdvice[]
  updated_by_admin User?        @relation("WeatherUpdater", fields: [updated_by], references: [user_id])

  @@index([district])
  @@map("weather_data")
}

model CropAdvice {
  advice_id  Int      @id @default(autoincrement())
  expert_id  Int?
  crop_id    Int
  weather_id Int?
  title      String
  content    String
  created_at DateTime @default(now())

  expert  Expert?  @relation(fields: [expert_id], references: [expert_id])
  crop    Crop     @relation(fields: [crop_id], references: [crop_id])
  weather Weather? @relation(fields: [weather_id], references: [weather_id])

  @@map("crop_advice")
}

model Expert {
  expert_id      Int      @id @default(autoincrement())
  user_id        Int      @unique
  specialization String
  bio            String?
  rating         Decimal  @default(0.0)
  is_verified    Boolean  @default(false)
  created_at     DateTime @default(now())

  bookings     ExpertBooking[]
  crop_advices CropAdvice[]
  user         User            @relation(fields: [user_id], references: [user_id])

  @@map("experts")
}

model ExpertBooking {
  booking_id   Int      @id @default(autoincrement())
  user_id      Int
  expert_id    Int
  status       String   @default("PENDING") // PENDING, CONFIRMED, COMPLETED, CANCELLED
  booking_date DateTime
  notes        String?
  created_at   DateTime @default(now())

  user   User   @relation(fields: [user_id], references: [user_id])
  expert Expert @relation(fields: [expert_id], references: [expert_id])

  @@map("expert_bookings")
}

model SoilTestRequest {
  request_id  Int      @id @default(autoincrement())
  user_id     Int
  plot_size   String
  address     String
  intended_crop String?
  crop_history String?
  status      String   @default("SUBMITTED") // SUBMITTED, SCHEDULED, IN_PROGRESS, COMPLETED
  result      String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  user User @relation(fields: [user_id], references: [user_id])

  @@map("soil_test_requests")
}

model Seed {
  seed_id     Int      @id @default(autoincrement())
  name        String
  name_bn     String?
  variety     String?
  crop_id     Int?
  season      String?
  price       Decimal?
  quantity    String?  // e.g., "5kg packet"
  supplier    String?
  district    String?
  is_available Boolean @default(true)
  created_at  DateTime @default(now())

  crop Crop? @relation(fields: [crop_id], references: [crop_id])

  @@map("seeds")
}

model Fertilizer {
  fertilizer_id Int      @id @default(autoincrement())
  name          String
  name_bn       String?
  type          String?  // UREA, TSP, MOP, DAP, GYPSUM
  price         Decimal?
  unit          String?  // kg, bag
  is_subsidized Boolean @default(false)
  created_at    DateTime @default(now())

  @@map("fertilizers")
}
```

### 3.6 Education

```prisma
model Institution {
  institution_id  Int      @id @default(autoincrement())
  name            String
  name_bn         String?
  type            String   // PRIMARY, SECONDARY, COLLEGE, UNIVERSITY, MADRASA, POLYTECHNIC, VOCATIONAL, COACHING
  district        String?
  upazila         String?
  address         String?
  phone           String?
  email           String?
  website         String?
  description     String?
  logo_url        String?
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  courses          Course[]
  students         Student[]
  announcements    InstitutionAnnouncement[]
  organisation     Organisation? @relation(fields: [organisation_id], references: [organisation_id])
  organisation_id  Int?

  @@map("institutions")
}

model Course {
  course_id      Int      @id @default(autoincrement())
  institution_id Int
  name           String
  name_bn        String?
  description    String?
  duration       String?  // e.g., "1 year"
  fee            Decimal?
  is_active      Boolean  @default(true)
  created_at     DateTime @default(now())

  institution    Institution     @relation(fields: [institution_id], references: [institution_id])
  teachers       CourseTeacher[]
  students       Student[]

  @@map("courses")
}

model CourseTeacher {
  id         Int      @id @default(autoincrement())
  course_id  Int
  user_id    Int
  
  course Course @relation(fields: [course_id], references: [course_id])
  user   User   @relation(fields: [user_id], references: [user_id])

  @@unique([course_id, user_id])
  @@map("course_teachers")
}

model Student {
  student_id     Int      @id @default(autoincrement())
  user_id        Int      @unique
  institution_id Int
  enrollment_date DateTime @default(now())
  status         String   @default("ACTIVE") // ACTIVE, GRADUATED, DROPPED, SUSPENDED
  created_at     DateTime @default(now())

  user         User         @relation(fields: [user_id], references: [user_id])
  institution  Institution  @relation(fields: [institution_id], references: [institution_id])
  courses      Course[]

  @@map("students")
}

model InstitutionAnnouncement {
  announcement_id Int      @id @default(autoincrement())
  institution_id  Int
  title           String
  content         String
  priority        String   @default("NORMAL")
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())

  institution Institution @relation(fields: [institution_id], references: [institution_id])

  @@map("institution_announcements")
}
```

### 3.7 NGOs & Social Support

```prisma
model Organisation {
  organisation_id Int      @id @default(autoincrement())
  name            String
  name_bn         String?
  type            String   // NGO, GOVERNMENT, PRIVATE, INTERNATIONAL
  description     String?
  website         String?
  email           String?
  phone           String?
  address         String?
  district        String?
  logo_url        String?
  is_verified     Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  members          OrganisationMember[]
  programmes       NgoProgramme[]
  donations        Donation[]
  institutions     Institution[]

  @@map("organisations")
}

model OrganisationMember {
  id              Int      @id @default(autoincrement())
  organisation_id Int
  user_id         Int
  role            String   @default("MEMBER") // ADMIN, MANAGER, MEMBER, VOLUNTEER
  
  organisation Organisation @relation(fields: [organisation_id], references: [organisation_id])
  user         User         @relation(fields: [user_id], references: [user_id])

  @@unique([organisation_id, user_id])
  @@map("organisation_members")
}

model NgoProgramme {
  programme_id    Int      @id @default(autoincrement())
  organisation_id Int
  name            String
  description     String?
  type            String   // FOOD, MEDICAL, SCHOLARSHIP, WOMEN, CHILD, ELDERLY, DISABILITY, DISASTER, MICROFINANCE, TRAINING
  start_date      DateTime?
  end_date        DateTime?
  status          String   @default("ACTIVE") // PLANNING, ACTIVE, COMPLETED, CANCELLED
  budget          Decimal?
  beneficiaries   Int?
  created_at      DateTime @default(now())

  organisation Organisation @relation(fields: [organisation_id], references: [organisation_id])
  enrolments   ProgrammeEnrolment[]

  @@map("ngo_programmes")
}

model ProgrammeEnrolment {
  id           Int      @id @default(autoincrement())
  programme_id Int
  user_id      Int
  status       String   @default("ACTIVE") // ACTIVE, COMPLETED, DROPPED
  enrolled_at  DateTime @default(now())

  programme NgoProgramme @relation(fields: [programme_id], references: [programme_id])
  user      User         @relation(fields: [user_id], references: [user_id])

  @@unique([programme_id, user_id])
  @@map("programme_enrolments")
}

model FoodSupport {
  id              Int      @id @default(autoincrement())
  organisation_id Int?
  user_id         Int
  food_type       String   // RICE, WHEAT, VEGETABLES, COOKED, OTHER
  quantity        String
  distribution_date DateTime
  location        String?
  status          String   @default("PENDING") // PENDING, DISTRIBUTED, CANCELLED
  created_at      DateTime @default(now())

  @@map("food_support")
}

model Donation {
  donation_id     Int      @id @default(autoincrement())
  organisation_id Int
  donor_name      String?
  amount          Decimal
  currency        String   @default("BDT")
  purpose         String?
  status          String   @default("RECEIVED") // PENDING, RECEIVED, ACKNOWLEDGED
  created_at      DateTime @default(now())

  organisation Organisation @relation(fields: [organisation_id], references: [organisation_id])

  @@map("donations")
}
```

### 3.8 Messaging

```prisma
model Conversation {
  conversation_id Int      @id @default(autoincrement())
  type            String   // DIRECT, GROUP, DEPARTMENT, COMPLAINT, APPLICATION
  name            String?  // For group/department chats
  department_id   Int?
  complaint_id    Int?
  application_id  Int?
  created_by      Int?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  department Department? @relation(fields: [department_id], references: [department_id])
  members    ConversationMember[]
  messages   Message[]

  @@map("conversations")
}

model ConversationMember {
  id              Int      @id @default(autoincrement())
  conversation_id Int
  user_id         Int
  role            String   @default("MEMBER") // ADMIN, MEMBER
  joined_at       DateTime @default(now())
  left_at         DateTime?
  last_read_at    DateTime?

  conversation Conversation @relation(fields: [conversation_id], references: [conversation_id], onDelete: Cascade)
  user         User         @relation(fields: [user_id], references: [user_id])

  @@unique([conversation_id, user_id])
  @@map("conversation_members")
}

model Message {
  message_id      Int      @id @default(autoincrement())
  conversation_id Int
  sender_id       Int
  
  content         String
  message_type    String   @default("TEXT") // TEXT, IMAGE, DOCUMENT, SYSTEM
  
  is_edited       Boolean  @default(false)
  is_deleted      Boolean  @default(false)
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  conversation Conversation @relation(fields: [conversation_id], references: [conversation_id], onDelete: Cascade)
  sender       User         @relation("MessageSender", fields: [sender_id], references: [user_id])
  attachments  MessageAttachment[]

  @@index([conversation_id])
  @@index([sender_id])
  @@map("messages")
}

model MessageAttachment {
  attachment_id Int      @id @default(autoincrement())
  message_id    Int
  file_name     String
  file_url      String
  file_size     Int?
  mime_type     String?
  created_at    DateTime @default(now())

  message Message @relation(fields: [message_id], references: [message_id], onDelete: Cascade)

  @@map("message_attachments")
}
```

### 3.9 Notifications

```prisma
model Notification {
  notification_id Int      @id @default(autoincrement())
  user_id         Int
  type            String   @default("IN_APP") // IN_APP, EMAIL, SMS, PUSH
  category        String?  // APPLICATION, COMPLAINT, MESSAGE, SYSTEM, REMINDER
  title           String
  message         String
  link            String?  // Deep link to relevant page
  is_read         Boolean  @default(false)
  read_at         DateTime?
  metadata        String?  // JSON: additional context
  created_at      DateTime @default(now())

  user User @relation(fields: [user_id], references: [user_id])

  @@index([user_id])
  @@index([is_read])
  @@map("notifications")
}
```

### 3.10 Projects & Budget

```prisma
model Project {
  project_id     Int       @id @default(autoincrement())
  title          String
  description    String
  location       String?
  department_id  Int?
  assigned_to    Int?      // Officer
  
  contractor     String?
  funding_source String?
  budget         Decimal
  spent          Decimal   @default(0)
  
  status         String    @default("PLANNED") // PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED
  progress       Int       @default(0)         // 0-100 percentage
  
  start_date     DateTime?
  deadline       DateTime?
  completed_at   DateTime?
  
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt

  department Department? @relation(fields: [department_id], references: [department_id])
  officer    User?       @relation("ProjectOfficer", fields: [assigned_to], references: [user_id])
  updates    ProjectUpdate[]
  budgets    ProjectBudget[]
  documents  ProjectDocument[]
  feedback   ProjectFeedback[]

  @@map("projects")
}

model ProjectUpdate {
  update_id   Int      @id @default(autoincrement())
  project_id  Int
  user_id     Int?
  
  title       String?
  description String?
  progress    Int?     // Updated percentage
  photo_url   String?
  spent       Decimal?
  
  created_at  DateTime @default(now())

  project Project @relation(fields: [project_id], references: [project_id], onDelete: Cascade)
  user    User?   @relation(fields: [user_id], references: [user_id])

  @@map("project_updates")
}

model ProjectBudget {
  budget_id   Int      @id @default(autoincrement())
  project_id  Int
  fiscal_year String   // e.g., "2025-2026"
  allocated   Decimal
  spent       Decimal  @default(0)
  notes       String?
  created_at  DateTime @default(now())

  project Project @relation(fields: [project_id], references: [project_id])

  @@map("project_budgets")
}

model ProjectDocument {
  doc_id      Int      @id @default(autoincrement())
  project_id  Int
  name        String
  file_url    String
  doc_type    String   // CONTRACT, REPORT, PHOTO, OTHER
  created_at  DateTime @default(now())

  project Project @relation(fields: [project_id], references: [project_id])

  @@map("project_documents")
}

model ProjectFeedback {
  feedback_id Int      @id @default(autoincrement())
  project_id  Int
  user_id     Int
  rating      Int?     // 1-5
  comment     String?
  created_at  DateTime @default(now())

  project Project @relation(fields: [project_id], references: [project_id])
  user    User    @relation(fields: [user_id], references: [user_id])

  @@map("project_feedback")
}
```

### 3.11 Waste Management

```prisma
model WasteZone {
  zone_id     Int      @id @default(autoincrement())
  name        String
  district    String
  upazila     String?
  zone_type   String   // RESIDENTIAL, COMMERCIAL, INDUSTRIAL, MIXED
  created_at  DateTime @default(now())

  reports WasteReport[]

  @@map("waste_zones")
}

model WasteReport {
  report_id   Int      @id @default(autoincrement())
  user_id     Int
  zone_id     Int?
  
  category    String   // COLLECTION, ILLEGAL_DUMPING, DRAINAGE, PLASTIC, E_WASTE, OTHER
  description String
  location    String?
  photo_url   String?
  status      String   @default("SUBMITTED") // SUBMITTED, IN_PROGRESS, RESOLVED
  
  assigned_to String?  // Worker/team name
  resolved_at DateTime?
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  zone WasteZone? @relation(fields: [zone_id], references: [zone_id])

  @@map("waste_reports")
}
```

### 3.12 Emergency & Events

```prisma
model EmergencyContact {
  contact_id  Int      @id @default(autoincrement())
  name        String
  type        String   // POLICE, FIRE, AMBULANCE, HOSPITAL, DISASTER, OTHER
  phone       String
  district    String?
  upazila     String?
  address     String?
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())

  @@map("emergency_contacts")
}

model Event {
  event_id    Int      @id @default(autoincrement())
  title       String
  description String?
  location    String?
  district    String?
  start_date  DateTime
  end_date    DateTime?
  type        String   // FESTIVAL, MEETING, TRAINING, CAMPAIGN, OTHER
  is_public   Boolean  @default(true)
  created_by  Int?
  created_at  DateTime @default(now())

  attendees EventAttendee[]

  @@map("events")
}

model EventAttendee {
  id        Int      @id @default(autoincrement())
  event_id  Int
  user_id   Int
  status    String   @default("REGISTERED") // REGISTERED, ATTENDED, CANCELLED
  
  event  Event @relation(fields: [event_id], references: [event_id])
  user   User  @relation(fields: [user_id], references: [user_id])

  @@unique([event_id, user_id])
  @@map("event_attendees")
}

model NewsArticle {
  news_id     Int      @id @default(autoincrement())
  title       String
  title_bn    String?
  content     String
  summary     String?
  image_url   String?
  category    String   // LOCAL, GOVERNMENT, AGRICULTURE, EDUCATION, HEALTH, OTHER
  district    String?
  is_published Boolean @default(false)
  published_at DateTime?
  created_by  Int?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@map("news_articles")
}
```

### 3.13 Payments & Common Tables

```prisma
model Payment {
  payment_id    Int      @id @default(autoincrement())
  user_id       Int
  amount        Decimal
  currency      String   @default("BDT")
  purpose       String   // SERVICE_FEE, APPLICATION_FEE, FINE, DONATION, OTHER
  entity_type   String?  // APPLICATION, SERVICE, PROJECT
  entity_id     Int?
  method        String?  // BKASH, NAGAD, CASH, CARD, BANK
  status        String   @default("PENDING") // PENDING, COMPLETED, FAILED, REFUNDED
  reference     String?  // External payment reference
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  user User @relation(fields: [user_id], references: [user_id])

  @@map("payments")
}

model SavedItem {
  saved_id   Int      @id @default(autoincrement())
  user_id    Int
  entity_type String  // SERVICE, APPLICATION, COMPLAINT, EVENT, NEWS
  entity_id  Int
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [user_id])

  @@unique([user_id, entity_type, entity_id])
  @@map("saved_items")
}

model UserActivity {
  activity_id Int      @id @default(autoincrement())
  user_id     Int
  action      String
  entity_type String
  entity_id   Int?
  metadata    String?  // JSON
  ip_address  String?
  created_at  DateTime @default(now())

  user User @relation(fields: [user_id], references: [user_id])

  @@index([user_id])
  @@map("user_activities")
}

model AuditLog {
  log_id      Int      @id @default(autoincrement())
  admin_id    Int
  action      String
  entity_type String
  entity_id   Int?
  old_value   String?  // JSON
  new_value   String?  // JSON
  details     String?  // JSON
  ip_address  String?
  created_at  DateTime @default(now())

  admin User @relation(fields: [admin_id], references: [user_id])

  @@index([admin_id])
  @@index([entity_type, entity_id])
  @@map("audit_logs")
}

model Certificate {
  cert_id      Int       @id @default(autoincrement())
  user_id      Int
  cert_type    String    // TRAINING, BIRTH, EDUCATION, LAND, OTHER
  status       String    @default("PENDING") // PENDING, APPROVED, REJECTED
  applied_at   DateTime  @default(now())
  approved_at  DateTime?
  approved_by  Int?
  document_url String?
  notes        String?

  user     User  @relation(fields: [user_id], references: [user_id])
  approver User? @relation("CertificateApprover", fields: [approved_by], references: [user_id])

  @@map("certificates")
}

model Category {
  category_id Int      @id @default(autoincrement())
  name        String   @unique
  type        String   // SERVICE, FORUM, OTHER
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())

  services    Service[]
  crops       Crop[]
  forum_posts ForumPost[]

  @@map("categories")
}

model ForumPost {
  post_id     Int      @id @default(autoincrement())
  user_id     Int
  category_id Int?
  title       String
  content     String
  tags        String   @default("[]") // JSON array
  likes       Int      @default(0)
  views       Int      @default(0)
  status      String   @default("PENDING") // PENDING, APPROVED, HIDDEN
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  user     User      @relation(fields: [user_id], references: [user_id])
  category Category? @relation(fields: [category_id], references: [category_id])

  @@map("forum_posts")
}

model Poll {
  poll_id    Int       @id @default(autoincrement())
  question   String
  options    String    @default("[]") // JSON array
  is_active  Boolean   @default(true)
  created_by Int
  created_at DateTime  @default(now())
  expires_at DateTime?

  votes Vote[]

  @@map("polls")
}

model Vote {
  vote_id  Int      @id @default(autoincrement())
  user_id  Int
  poll_id  Int
  choice   String
  voted_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [user_id])
  poll Poll @relation(fields: [poll_id], references: [poll_id])

  @@unique([user_id, poll_id])
  @@map("votes")
}
```

---

## 4. Indexes Summary

| Table | Indexed Columns | Reason |
|-------|----------------|--------|
| users | email, phone, nid | Unique lookups |
| applications | user_id, status, service_id | Frequent filtering |
| complaints | user_id, status, category, department_id | Frequent filtering |
| messages | conversation_id, sender_id | Chat queries |
| notifications | user_id, is_read | User notification feed |
| market_prices | crop_id, recorded_at | Price lookups |
| weather_data | district | Weather by district |
| audit_logs | admin_id, entity_type+entity_id | Audit trail queries |
| user_activities | user_id | Activity feed |

---

## 5. Seed Data Strategy

### 5.1 System Roles (Seeded)
- SUPER_ADMIN, SUB_ADMIN, OFFICER, SERVICE_PROVIDER, NGO_ADMIN, INSTITUTION_ADMIN, TEACHER, CITIZEN

### 5.2 System Permissions (Seeded)
- Module-based: user.*, complaint.*, application.*, service.*, project.*, budget.*, department.*, message.*, notification.*, agriculture.*, education.*, ngo.*, event.*, news.*, audit.*, settings.*

### 5.3 Demo Data
- 8 users (one per role)
- 5 departments (Agriculture, Health, Education, Infrastructure, Social)
- 10 services across categories
- 5 crops with market prices
- 3 complaints in different statuses
- 2 projects with budgets
- 10 conversations with messages
- Sample notifications
