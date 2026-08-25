# Implementation Plan (IMPLEMENTATION_PLAN.md)
## PolliBondhu — Phased Development Roadmap

**Version:** 2.0  
**Date:** August 2026  
**Total Phases:** 14 (Phase 0-13)  

---

## Phase Overview

| Phase | Focus | Priority | Dependencies |
|-------|-------|----------|--------------|
| 0 | Audit & Gap Analysis | ✅ Done | None |
| 1 | Planning Documents | ✅ Done | Phase 0 |
| 2 | Database Schema & Migration | 🔴 Critical | Phase 1 |
| 3 | RBAC System | 🔴 Critical | Phase 2 |
| 4 | UI/UX Design System | 🔴 Critical | Phase 1 |
| 5 | Navigation & Layouts | 🔴 Critical | Phase 4 |
| 6 | Government Service Architecture | 🔴 Critical | Phase 2, 3 |
| 7 | Agriculture, Education, NGO Modules | 🟡 Important | Phase 2, 3, 6 |
| 8 | Complaints, Projects & Transparency | 🟡 Important | Phase 2, 3 |
| 9 | Messaging & Notifications | 🟡 Important | Phase 2, 3 |
| 10 | AI Assistant with RBAC | 🟡 Important | Phase 3, 9 |
| 11 | Role-Based Dashboards | 🟡 Important | Phase 4-10 |
| 12 | Testing & Coverage | 🔴 Critical | All phases |
| 13 | Build, Lint, Security & Polish | 🔴 Critical | All phases |

---

## Phase 0: Audit & Gap Analysis ✅
**Status:** Complete  

### Deliverables
- [x] Full codebase inspection (frontend, backend, database, tests)
- [x] Architecture analysis
- [x] Gap identification (35+ gaps found)
- [x] Prioritized gap analysis

### Key Findings
1. Database uses SQLite, not PostgreSQL as claimed
2. RBAC is basic string roles — no permission tables
3. 30+ missing database tables for expanded modules
4. SubAdmin/Officer dashboards hit non-existent API endpoints
5. AdminDashboard uses extensive hardcoded mock data
6. No real messaging persistence
7. UI inconsistency between public and dashboard pages

---

## Phase 1: Planning Documents ✅
**Status:** Complete  

### Deliverables
- [x] PRD.md — Product Requirements Document
- [x] TRD.md — Technical Requirements Document
- [x] APP_FLOW.md — Application Flow & Screen Structure
- [x] UI_UX_BRIEF.md — UI/UX Design System
- [x] BACKEND_SCHEMA.md — Database Schema Specification
- [x] SYSTEM_ARCHITECTURE.md — System Architecture
- [x] RBAC_MATRIX.md — Role & Permission Matrix
- [x] API_SPECIFICATION.md — API Endpoint Specification
- [x] TESTING_STRATEGY.md — Testing Strategy
- [x] DESIGN_PATTERNS.md — Design Patterns Documentation
- [x] IMPLEMENTATION_PLAN.md — This document

---

## Phase 2: Database Schema & Migration
**Duration:** ~2-3 days  
**Priority:** 🔴 Critical  

### Objectives
- Migrate from SQLite to PostgreSQL
- Implement complete normalized schema
- Create proper RBAC tables
- Set up seed data with system roles and permissions

### Tasks

#### 2.1 Database Engine Migration
- [ ] Update `schema.prisma`: change `provider = "sqlite"` to `provider = "postgresql"`
- [ ] Update `DATABASE_URL` in `.env` and `.env.example` to PostgreSQL connection string
- [ ] Verify Docker Compose PostgreSQL service works
- [ ] Run `npx prisma generate` to verify PostgreSQL client

#### 2.2 RBAC Tables
- [ ] Create `roles` table with system roles (SUPER_ADMIN, SUB_ADMIN, OFFICER, SERVICE_PROVIDER, NGO_ADMIN, INSTITUTION_ADMIN, TEACHER, CITIZEN)
- [ ] Create `permissions` table with all permissions from RBAC_MATRIX.md
- [ ] Create `role_permissions` junction table
- [ ] Create `user_roles` junction table
- [ ] Create `departments` table (exists, enhance with `is_active`)
- [ ] Create `user_departments` junction table
- [ ] Create `locations` table with hierarchy (DIVISION → DISTRICT → UPAZILA → UNION → VILLAGE)
- [ ] Create `user_locations` junction table

#### 2.3 Service & Application Tables
- [ ] Create `service_categories` table (rename/replace `categories`)
- [ ] Enhance `services` table (add `name_bn`, `eligibility`, `required_docs`, `processing_time`, `department_id`, `is_public`)
- [ ] Create `applications` table with full lifecycle fields
- [ ] Create `application_documents` table
- [ ] Create `application_updates` table

#### 2.4 Complaint Enhancement
- [ ] Add `tracking_id`, `assigned_to`, `deadline`, `citizen_feedback`, `citizen_rating` to complaints
- [ ] Create `complaint_updates` table
- [ ] Create `complaint_documents` table
- [ ] Add proper indexes on status, category, department_id

#### 2.5 Education Tables
- [ ] Create `institutions` table
- [ ] Create `courses` table
- [ ] Create `course_teachers` junction table
- [ ] Create `students` table
- [ ] Create `institution_announcements` table

#### 2.6 NGO Tables
- [ ] Create `organisations` table
- [ ] Create `organisation_members` junction table
- [ ] Create `ngo_programmes` table
- [ ] Create `programme_enrolments` table
- [ ] Create `food_support` table
- [ ] Create `donations` table

#### 2.7 Messaging Tables
- [ ] Create `conversations` table (DIRECT, GROUP, DEPARTMENT, COMPLAINT, APPLICATION)
- [ ] Create `conversation_members` junction table
- [ ] Enhance `messages` table (add `conversation_id`, `message_type`, `is_edited`, `is_deleted`)
- [ ] Create `message_attachments` table
- [ ] Remove old `sender_id`/`receiver_id` pattern from messages

#### 2.8 Project & Budget Tables
- [ ] Enhance `projects` table (add `contractor`, `funding_source`, `start_date`, `completed_at`)
- [ ] Create `project_updates` table
- [ ] Create `project_budgets` table
- [ ] Create `project_documents` table
- [ ] Create `project_feedback` table

#### 2.9 Other Tables
- [ ] Create `waste_zones` table
- [ ] Create `waste_reports` table
- [ ] Enhance `emergency_contacts` table (add `type`, `district`, `upazila`)
- [ ] Create `events` table
- [ ] Create `event_attendees` table
- [ ] Create `news_articles` table
- [ ] Create `payments` table
- [ ] Create `saved_items` table (replace `saved_services`)
- [ ] Create `soil_test_requests` table
- [ ] Create `seeds` table
- [ ] Create `fertilizers` table

#### 2.10 Indexes & Optimization
- [ ] Add indexes on all frequently queried columns
- [ ] Add soft deletion (`deleted_at`) where appropriate
- [ ] Verify all foreign key relationships
- [ ] Run `npx prisma db push` to apply schema

#### 2.11 Seed Data
- [ ] Seed system roles (8 roles)
- [ ] Seed all permissions (module.action format)
- [ ] Seed role-permission mappings
- [ ] Seed 5 departments
- [ ] Seed demo users (one per role)
- [ ] Seed service categories
- [ ] Seed demo services, crops, complaints, projects
- [ ] Seed demo conversations and messages

### Verification
- [ ] `npx prisma generate` succeeds
- [ ] `npx prisma db push` succeeds
- [ ] `npx prisma db seed` succeeds
- [ ] All existing tests still pass (after updating mocks for PostgreSQL)

---

## Phase 3: RBAC System
**Duration:** ~2-3 days  
**Priority:** 🔴 Critical  
**Depends on:** Phase 2  

### Objectives
- Implement full RBAC middleware
- Enforce permissions at API level
- Update auth flow to include roles and permissions

### Tasks

#### 3.1 Auth Middleware Enhancement
- [ ] Update `authMiddleware` to load user's roles, permissions, departments, locations from database
- [ ] Attach full RBAC context to `req.user` (roles[], permissions[], departments[], locations[])
- [ ] Implement token payload enhancement (include role names, not just one role)

#### 3.2 Permission Middleware
- [ ] Create `requirePermission(...permissions: string[])` middleware
- [ ] Create `requireDepartmentAccess` middleware
- [ ] Create `requireLocationAccess` middleware
- [ ] Create `requireOwnership(entityType: string)` middleware

#### 3.3 Role-Based Route Protection
- [ ] Update all routes to use `requirePermission` instead of `requireRole`
- [ ] Add department scoping to complaint, application, project routes
- [ ] Add location scoping where applicable
- [ ] Ensure SUPER_ADMIN bypasses all checks

#### 3.4 Frontend RBAC Integration
- [ ] Update `AuthContext` to fetch and store user's permissions on login
- [ ] Update `hasPermission` to check against actual permission list
- [ ] Update `Protected` component to check permissions
- [ ] Update navigation to show/hide based on permissions

#### 3.5 AI RBAC Enforcement
- [ ] Update AI system prompt to include user's full permission set
- [ ] Add permission-checking middleware for AI endpoints
- [ ] Implement response filtering based on user's access level

### Verification
- [ ] CITIZEN cannot access admin endpoints → 403
- [ ] OFFICER cannot access other officer's cases → 403
- [ ] SUB_ADMIN cannot access other department's data → 403
- [ ] SUPER_ADMIN can access everything → 200
- [ ] AI assistant respects same RBAC rules
- [ ] All existing tests pass

---

## Phase 4: UI/UX Design System
**Duration:** ~2-3 days  
**Priority:** 🔴 Critical  
**Depends on:** Phase 1  

### Objectives
- Create consistent design system
- Add missing UI components
- Unify colour scheme across public and dashboard pages

### Tasks

#### 4.1 Design Tokens
- [ ] Update `tailwind.config.js` with full colour palette (primary, neutral, semantic)
- [ ] Define typography scale (display, h1-h4, body, body-sm, caption, badge)
- [ ] Define spacing scale (space-1 through space-12)
- [ ] Define border radius tokens
- [ ] Define shadow tokens
- [ ] Update `index.css` with CSS variables

#### 4.2 New UI Components
- [ ] Create `Modal` component (overlay, header, body, footer)
- [ ] Create `ConfirmDialog` component (replaces window.confirm)
- [ ] Create `Tabs` component (with active indicator)
- [ ] Create `Breadcrumb` component
- [ ] Create `EmptyState` component (icon, title, description, CTA)
- [ ] Create `Skeleton` component (text, circle, rectangle, card variants)
- [ ] Create `Avatar` component (image, fallback, sizes)
- [ ] Create `Dropdown` component
- [ ] Create `Tooltip` component
- [ ] Create `FormField` component (label, input, error, helper)
- [ ] Create `FormSelect` component
- [ ] Create `FormTextarea` component
- [ ] Create `SearchInput` component (with icon and clear button)
- [ ] Create `StatusBadge` component (colour-coded by status)
- [ ] Create `ProgressBar` component
- [ ] Create `Pagination` component

#### 4.3 Design System Consistency
- [ ] Unify public pages to use white/light theme (remove dark glassmorphism)
- [ ] Update all hardcoded colours to use Tailwind tokens
- [ ] Ensure all interactive elements have focus rings
- [ ] Ensure minimum touch target sizes (44px)
- [ ] Add ARIA labels to all interactive elements

#### 4.4 Accessibility
- [ ] Add skip-to-content link
- [ ] Verify colour contrast ratios (WCAG AA)
- [ ] Add keyboard navigation for modals and dropdowns
- [ ] Add aria-labels to icon-only buttons
- [ ] Ensure form inputs have associated labels

### Verification
- [ ] All components render correctly at 320px, 768px, 1024px, 1920px
- [ ] No hardcoded colours remain
- [ ] All interactive elements are keyboard accessible
- [ ] Visual consistency across public and dashboard pages

---

## Phase 5: Navigation & Layouts
**Duration:** ~1-2 days  
**Priority:** 🔴 Critical  
**Depends on:** Phase 4  

### Objectives
- Implement mobile-responsive navigation
- Add missing page routes
- Add breadcrumbs

### Tasks

#### 5.1 Mobile Navigation
- [ ] Add bottom tab bar for citizen dashboard (mobile)
- [ ] Add bottom tab bar for admin dashboard (mobile)
- [ ] Add bottom tab bar for officer dashboard (mobile)
- [ ] Ensure sidebar collapses on tablet (768px-1024px)

#### 5.2 Public Navigation Enhancement
- [ ] Add Healthcare, Education, Emergency, News links to public nav
- [ ] Update footer with real links (not href="#")
- [ ] Add mobile hamburger menu improvements

#### 5.3 Route Updates
- [ ] Add routes for: `/healthcare`, `/education`, `/emergency`, `/news`, `/events`
- [ ] Add routes for citizen: `/dashboard/applications`, `/dashboard/complaints`, `/dashboard/messages`, `/dashboard/notifications`, `/dashboard/documents`
- [ ] Add routes for officer: `/officer`, `/officer/applications`, `/officer/complaints`, `/officer/messages`, `/officer/citizens`
- [ ] Add routes for admin: `/admin/departments`, `/admin/projects`, `/admin/budgets`, `/admin/announcements`, `/admin/audit`
- [ ] Update `RoleBasedDashboard` to handle all new roles

#### 5.4 Breadcrumbs
- [ ] Add `Breadcrumb` component to all dashboard pages
- [ ] Implement breadcrumb generation from route hierarchy

### Verification
- [ ] All routes accessible and render correct pages
- [ ] Mobile navigation works on all layout types
- [ ] Breadcrumbs show correct hierarchy
- [ ] Dead footer links removed

---

## Phase 6: Government Service Architecture
**Duration:** ~3-4 days  
**Priority:** 🔴 Critical  
**Depends on:** Phase 2, 3  

### Objectives
- Implement service catalog with categories
- Build application submission and tracking workflow
- Create service detail pages

### Tasks

#### 6.1 Backend - Services
- [ ] Create `ServiceCategoryRepository`
- [ ] Create `ServiceService` (enhanced from existing)
- [ ] Create `ServiceController` (enhanced from existing)
- [ ] Add service CRUD with RBAC enforcement
- [ ] Add service search with Strategy pattern

#### 6.2 Backend - Applications
- [ ] Create `ApplicationRepository`
- [ ] Create `ApplicationService`
- [ ] Create `ApplicationController`
- [ ] Implement application lifecycle (SUBMITTED → CLOSED)
- [ ] Implement document upload for applications
- [ ] Implement application timeline tracking
- [ ] Implement citizen feedback on applications

#### 6.3 Backend - File Upload
- [ ] Set up multer for file upload handling
- [ ] Create `/api/upload` endpoint
- [ ] Implement file type and size validation
- [ ] Set up local file storage (development)

#### 6.4 Frontend - Service Catalog
- [ ] Redesign `/services` page with real API data
- [ ] Create `ServiceCard` component
- [ ] Create `ServiceDetail` page with full info
- [ ] Create service category filter
- [ ] Replace hardcoded service list with API calls

#### 6.5 Frontend - Application Flow
- [ ] Create application form component
- [ ] Create document upload component
- [ ] Create application tracking page
- [ ] Create application timeline component
- [ ] Create "My Applications" page for citizens

### Verification
- [ ] Citizen can browse services and apply
- [ ] Application appears in "My Applications"
- [ ] Officer can see and process applications
- [ ] Application status updates trigger notifications
- [ ] File upload works for documents

---

## Phase 7: Agriculture, Education & NGO Modules
**Duration:** ~3-4 days  
**Priority:** 🟡 Important  
**Depends on:** Phase 2, 3, 6  

### Objectives
- Complete agriculture ecosystem
- Implement education institution management
- Implement NGO programme management

### Tasks

#### 7.1 Agriculture Enhancement
- [ ] Add seeds, fertilizers endpoints
- [ ] Add soil test request workflow
- [ ] Add expert booking system
- [ ] Enhance crop advisory with real data
- [ ] Add agriculture officer assignment

#### 7.2 Education Module
- [ ] Create `InstitutionRepository`, `InstitutionService`, `InstitutionController`
- [ ] Create `CourseRepository`, `CourseService`, `CourseController`
- [ ] Implement institution CRUD with RBAC
- [ ] Implement course management
- [ ] Implement student enrollment
- [ ] Implement institution announcements

#### 7.3 NGO Module
- [ ] Create `OrganisationRepository`, `OrganisationService`, `OrganisationController`
- [ ] Create `ProgrammeService`
- [ ] Implement NGO CRUD with RBAC
- [ ] Implement programme management
- [ ] Implement programme enrollment
- [ ] Implement donation tracking

#### 7.4 Frontend Pages
- [ ] Create Education page (institution list, detail)
- [ ] Create NGO page (NGO list, detail, programmes)
- [ ] Enhance Agriculture page with new data
- [ ] Create institution admin dashboard

### Verification
- [ ] Education institutions can be listed and viewed
- [ ] Courses can be created and students enrolled
- [ ] NGO programmes can be listed and citizens can enroll
- [ ] Agriculture page shows all data from API

---

## Phase 8: Complaints, Projects & Transparency
**Duration:** ~3-4 days  
**Priority:** 🟡 Important  
**Depends on:** Phase 2, 3  

### Objectives
- Complete complaint lifecycle
- Implement government project transparency
- Implement budget tracking

### Tasks

#### 8.1 Complaint Enhancement
- [ ] Add complaint tracking ID generation (COMP-2024-XXXX)
- [ ] Add complaint assignment workflow
- [ ] Add complaint timeline with updates
- [ ] Add citizen verification flow
- [ ] Add complaint document upload
- [ ] Add department-based routing

#### 8.2 Project Module
- [ ] Create `ProjectRepository`, `ProjectService`, `ProjectController`
- [ ] Implement project CRUD with RBAC
- [ ] Implement project progress updates
- [ ] Implement project budget management
- [ ] Implement citizen feedback on projects
- [ ] Implement project timeline

#### 8.3 Budget Transparency
- [ ] Create budget allocation endpoints
- [ ] Create budget expenditure tracking
- [ ] Create public project listing page
- [ ] Create project detail page with progress

#### 8.4 Frontend
- [ ] Redesign complaint submission form
- [ ] Create complaint tracking page with timeline
- [ ] Create project listing page (public)
- [ ] Create project detail page with budget info
- [ ] Create project progress update form (officer)

### Verification
- [ ] Full complaint lifecycle works (SUBMITTED → CLOSED)
- [ ] Projects visible to public with progress
- [ ] Budget information visible on project pages
- [ ] Officer can update project progress

---

## Phase 9: Messaging & Notifications
**Duration:** ~3-4 days  
**Priority:** 🟡 Important  
**Depends on:** Phase 2, 3  

### Objectives
- Implement persistent messaging
- Implement real-time notifications
- Create messaging UI

### Tasks

#### 9.1 Backend - Messaging
- [ ] Create `ConversationRepository`
- [ ] Create `MessageRepository`
- [ ] Create `MessagingService`
- [ ] Create `MessagingController`
- [ ] Implement conversation CRUD
- [ ] Implement message persistence
- [ ] Implement read/delivered status
- [ ] Implement conversation member management

#### 9.2 Backend - Socket.io Enhancement
- [ ] Authenticate WebSocket connections with JWT
- [ ] Implement room-based messaging (conversation rooms)
- [ ] Implement typing indicators
- [ ] Implement read receipts
- [ ] Implement online/offline status
- [ ] Handle reconnection

#### 9.3 Backend - Notifications
- [ ] Create `NotificationRepository`
- [ ] Create `NotificationService`
- [ ] Create `NotificationController`
- [ ] Implement notification CRUD
- [ ] Implement bulk notification creation
- [ ] Implement read/unread status

#### 9.4 Frontend - Messaging UI
- [ ] Create conversation list component
- [ ] Create chat view component
- [ ] Create message input with attachments
- [ ] Create typing indicator
- [ ] Create read receipts
- [ ] Create department chat
- [ ] Create complaint-linked chat

#### 9.5 Frontend - Notifications
- [ ] Create notification list page
- [ ] Create notification dropdown (header)
- [ ] Create unread count badge
- [ ] Implement real-time notification updates

### Verification
- [ ] Users can send and receive messages
- [ ] Messages persist in database
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] Notifications appear in real-time
- [ ] Department chat works

---

## Phase 10: AI Assistant with RBAC
**Duration:** ~1-2 days  
**Priority:** 🟡 Important  
**Depends on:** Phase 3, 9  

### Objectives
- Enhance AI assistant with full RBAC enforcement
- Add context-aware responses
- Add quick actions

### Tasks

#### 10.1 Backend AI Enhancement
- [ ] Update `groqService.ts` with comprehensive system prompt
- [ ] Add RBAC context to AI system prompt (user's role, permissions, departments)
- [ ] Add context provider for agriculture, services, complaints
- [ ] Add permission-based response filtering
- [ ] Add AI interaction logging for audit

#### 10.2 Frontend AI Enhancement
- [ ] Enhance `AiChatWidget` with better UI
- [ ] Add quick action buttons ("Find services", "Track application", "File complaint")
- [ ] Add suggestion chips
- [ ] Add conversation history (session-based)
- [ ] Add loading states and error handling

#### 10.3 AI RBAC Testing
- [ ] Test CITIZEN cannot access admin data via AI
- [ ] Test OFFICER can only access assigned data via AI
- [ ] Test SUPER_ADMIN can access everything via AI
- [ ] Test AI cannot leak other users' private data

### Verification
- [ ] AI responds based on user's role
- [ ] AI cannot access data beyond user's permissions
- [ ] AI provides relevant suggestions based on role
- [ ] AI interactions are logged

---

## Phase 11: Role-Based Dashboards
**Duration:** ~3-4 days  
**Priority:** 🟡 Important  
**Depends on:** Phase 4-10  

### Objectives
- Create functional dashboards for each role
- Replace all hardcoded mock data with real API calls
- Add proper loading, empty, and error states

### Tasks

#### 11.1 Super Admin Dashboard
- [ ] Create `SuperAdminDashboard` with real stats from facade
- [ ] Add location drill-down (District → Upazila → Union → Village)
- [ ] Add department overview
- [ ] Add budget overview
- [ ] Add emergency alerts
- [ ] Add RBAC structure visualization
- [ ] Remove all hardcoded MOCK_KPI, DEPT_STATS, PIE_DATA, etc.

#### 11.2 Sub-Admin Dashboard
- [ ] Create `SubAdminDashboard` with department-scoped stats
- [ ] Add officer management
- [ ] Add department complaint overview
- [ ] Add department project overview
- [ ] Implement `/admin/sub-dashboard-stats` endpoint

#### 11.3 Officer Dashboard
- [ ] Create `OfficerDashboard` with assigned task stats
- [ ] Add task list (assigned applications, complaints)
- [ ] Add citizen list (assigned citizens)
- [ ] Integrate messaging
- [ ] Implement `/admin/officer-dashboard-stats` endpoint

#### 11.4 Citizen Dashboard
- [ ] Update `UserDashboard` with real API data
- [ ] Add real weather data
- [ ] Add real announcements
- [ ] Add real activity feed
- [ ] Add quick links to applications and complaints

#### 11.5 Provider Dashboard
- [ ] Update `ProviderDashboard` with real API data
- [ ] Add service creation form
- [ ] Add service analytics
- [ ] Remove hardcoded service list

#### 11.6 Admin Pages
- [ ] Update `UserManagement` with full RBAC support
- [ ] Update `ServiceManagement` with new service schema
- [ ] Update `ComplaintResolution` with full lifecycle
- [ ] Add `DepartmentManagement` page
- [ ] Add `ProjectManagement` page
- [ ] Add `BudgetManagement` page
- [ ] Add `AuditLogViewer` page
- [ ] Add `AnnouncementManagement` page

### Verification
- [ ] All dashboards show real data from API
- [ ] No hardcoded mock data remains
- [ ] All dashboard actions work (approve, reject, assign, etc.)
- [ ] Loading skeletons show during data fetch
- [ ] Empty states show when no data
- [ ] Error states show on API failure

---

## Phase 12: Testing & Coverage
**Duration:** ~3-4 days  
**Priority:** 🔴 Critical  
**Depends on:** All implementation phases  

### Objectives
- Achieve 70%+ line and branch coverage
- Test all RBAC boundaries
- Test all critical user flows

### Tasks

#### 12.1 New Unit Tests
- [ ] Test `ApplicationService` (create, process, timeline)
- [ ] Test `ComplaintService` (enhanced lifecycle)
- [ ] Test `MessagingService` (conversations, messages)
- [ ] Test `NotificationService` (CRUD, bulk)
- [ ] Test `ProjectService` (CRUD, progress, budget)
- [ ] Test `InstitutionService` (CRUD, courses, enrollment)
- [ ] Test `OrganisationService` (CRUD, programmes)

#### 12.2 RBAC Tests
- [ ] Test every role against every protected endpoint
- [ ] Test department scoping (SUB_ADMIN cannot see other departments)
- [ ] Test location scoping (OFFICER cannot see other locations)
- [ ] Test ownership checks (CITIZEN cannot see other's data)
- [ ] Test AI RBAC enforcement

#### 12.3 Integration Tests
- [ ] Test full application submission flow
- [ ] Test full complaint lifecycle flow
- [ ] Test messaging flow (create conversation → send message → read)
- [ ] Test notification flow (event → observer → notification → read)
- [ ] Test admin dashboard data aggregation

#### 12.4 Coverage Analysis
- [ ] Run `npm test -- --coverage`
- [ ] Identify uncovered lines
- [ ] Add tests for critical uncovered paths
- [ ] Verify 70%+ threshold met

### Verification
- [ ] `npm test` passes with 0 failures
- [ ] Coverage report shows 70%+ line and branch
- [ ] No skipped tests without justification
- [ ] All RBAC boundaries tested

---

## Phase 13: Build, Lint, Security & Polish
**Duration:** ~2-3 days  
**Priority:** 🔴 Critical  
**Depends on:** All phases  

### Objectives
- Ensure clean build
- Fix all TypeScript errors
- Security audit
- UX polish

### Tasks

#### 13.1 Build Verification
- [ ] `npm run build` succeeds (backend)
- [ ] `npm run build` succeeds (frontend)
- [ ] No TypeScript errors
- [ ] No ESLint errors/warnings

#### 13.2 Security Audit
- [ ] Verify no hardcoded secrets
- [ ] Verify `.env` in `.gitignore`
- [ ] Verify all inputs validated with Zod
- [ ] Verify RBAC enforced on all endpoints
- [ ] Verify no SQL injection vectors (Prisma handles this)
- [ ] Verify no XSS vectors (React handles this)
- [ ] Verify rate limiting on all endpoints
- [ ] Verify CORS properly configured

#### 13.3 UX Polish
- [ ] Add loading states to all pages
- [ ] Add empty states to all list pages
- [ ] Add error states with retry buttons
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add success toasts for all user actions
- [ ] Verify mobile responsiveness on all pages
- [ ] Test on 320px, 768px, 1024px, 1920px viewports

#### 13.4 Documentation
- [ ] Update README.md with current architecture
- [ ] Update API documentation
- [ ] Update demo credentials
- [ ] Update installation instructions

#### 13.5 Final Testing
- [ ] Run full test suite
- [ ] Run manual smoke test of all critical flows
- [ ] Verify Docker Compose works end-to-end
- [ ] Verify all seed data loads correctly

### Verification
- [ ] Clean build with no errors
- [ ] All tests pass
- [ ] No security vulnerabilities
- [ ] All pages responsive
- [ ] All user flows functional

---

## Phase Completion Checklist

After each phase, verify:

```bash
# TypeScript check
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build
cd backend && npm run build
cd frontend && npm run build

# Tests
cd backend && npm test

# Database
npx prisma generate
npx prisma db push

# Manual check
# - Start dev servers
# - Test affected screens
# - Fix regressions before continuing
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Schema changes break existing tests | Update mocks before schema changes |
| PostgreSQL migration fails | Test with Docker Compose first |
| RBAC middleware too slow | Cache user permissions, add indexes |
| Socket.io scaling issues | Use Redis adapter for multi-server |
| AI RBAC bypass | Multiple validation layers, audit logging |
| Mobile responsiveness | Test on real devices, use browser dev tools |
| Test coverage drop | Run coverage check in CI, fail below threshold |
