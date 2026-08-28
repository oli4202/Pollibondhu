<div align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-success?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Coverage-93%25-brightgreen?style=for-the-badge&logo=jest&logoColor=white" alt="Coverage 93%" />
  <img src="https://img.shields.io/badge/Design_Patterns-5_Implemented-blueviolet?style=for-the-badge" alt="Patterns" />
</div>

<br/>

# 🌾 PolliBondhu — Smart Village Platform

A comprehensive digital platform for rural Bangladesh connecting citizens, service providers, government officers, and NGOs.

> **🌟 Project for Academic Submission** — Implements **5 software design patterns**, **≥90% unit test coverage**, and a full CI-ready test suite with Jest. Beautifully designed with modern React & TailwindCSS.

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Roles & Responsibilities](#roles--responsibilities)
- [Design Patterns](#design-patterns)
- [Software Testing](#software-testing)
- [Getting Started](#getting-started)
- [Real-Time Features](#real-time-features)

---

## 🏗️ Architecture

```
pollibondhu/
├── backend/          # Express.js + Prisma + Socket.io
│   ├── src/
│   │   ├── config/           # Environment configuration
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── patterns/         # Design patterns (Singleton, Factory, Strategy, Observer, Facade)
│   │   ├── repositories/     # Database access layer
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utilities (JWT, upload, API response)
│   │   └── validators/       # Request validation schemas
│   ├── tests/
│   │   ├── unit/             # Unit tests (services, controllers, repos, patterns, utils)
│   │   └── integration/      # Integration tests (API, agriculture)
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── seed-rbac.ts      # RBAC seed script
└── frontend/         # React + TypeScript + Vite + Tailwind
    └── src/
        ├── components/       # Reusable UI components
        ├── contexts/         # React contexts (Auth)
        ├── hooks/            # Custom React hooks
        ├── pages/            # Page components
        │   ├── admin/        # Admin dashboard pages
        │   ├── auth/         # Login, Register, Forgot Password
        │   ├── officer/      # Officer dashboard pages
        │   ├── provider/     # Service provider pages
        │   ├── public/       # Public pages (Home, Services, etc.)
        │   └── user/         # Citizen dashboard pages
        ├── routes/           # Route definitions
        ├── types/            # TypeScript types
        └── utils/            # Utilities (API client, helpers)
```

---

## 👥 Roles & Responsibilities

### Role Hierarchy

```
SUPER_ADMIN (1) — Full system access, manage all admins/users/data
SUB_ADMIN (N)  — Manage assigned departments
OFFICER (N)    — Handle complaints, tasks, applications for department
GOV_SERVICE_PROVIDER — Provide government services, manage applications
SERVICE_PROVIDER — List marketplace services
CITIZEN (N)    — Submit applications, complaints, buy services
```

### RBAC System

1. **Role definition**: Roles and permissions are defined in the database
2. **User assignment**: Users are assigned roles via `user_roles` table
3. **Permission resolution**: When a user logs in, their permissions are loaded from all assigned roles and cached for 5 minutes
4. **Middleware checks**: API endpoints use `requirePermission()` or `requireAnyPermission()` middleware
5. **ADMIN bypass**: The SUPER_ADMIN role automatically bypasses all permission checks

### Seeding RBAC

```bash
cd backend
npx ts-node prisma/seed-rbac.ts
```

---

## 🎨 Design Patterns

This project implements **5 software design patterns**, all located in `backend/src/patterns/`.

---

### 1. 🔒 Singleton Pattern

**File:** [`backend/src/patterns/singleton/DatabaseManager.ts`](backend/src/patterns/singleton/DatabaseManager.ts)

**Problem Solved:** Prevent multiple `PrismaClient` instances from being created, which would exhaust the database connection pool and cause memory leaks.

**How it works:** The `DatabaseManager` class holds a single static `PrismaClient` instance. Any module importing `prisma` gets the same shared connection.

**UML Diagram:**
```
┌───────────────────────────────────┐
│         DatabaseManager           │
│  ─────────────────────────────   │
│  - instance: DatabaseManager      │ ← private static
│  - prisma: PrismaClient           │
│  ─────────────────────────────   │
│  + getInstance(): DatabaseManager │ ← creates once, reuses after
│  + getPrisma(): PrismaClient      │
└───────────────────────────────────┘
         ▲ imported by all services/controllers
```

**Where used:** Every service and controller imports `prisma` from this singleton.

---

### 2. 🏭 Factory Method Pattern

**File:** [`backend/src/patterns/factory/NotificationFactory.ts`](backend/src/patterns/factory/NotificationFactory.ts)

**Problem Solved:** Creating notifications without hard-coding which exact `Notification` subtype to create — the factory decides.

**How it works:** `NotificationFactory.create(type, data)` returns the correct notification shape (APPLICATION, COMPLAINT, SYSTEM, etc.) without callers needing to know about the internal structure.

**UML Diagram:**
```
      «interface»
   NotificationCreator
   + create(type, data)
          ▲
          │ implements
  NotificationFactory
  + create(type, data): Notification
       /       |        \
  APPLICATION COMPLAINT  SYSTEM
  Notification Notification Notification
```

**Where used:** `NotificationSubject` uses `NotificationFactory` to create typed notifications when events fire.

---

### 3. 🔄 Strategy Pattern

**File:** [`backend/src/patterns/strategy/SearchStrategy.ts`](backend/src/patterns/strategy/SearchStrategy.ts)

**Problem Solved:** Swapping search algorithms at runtime without changing the controller. Services, Crops, and Experts all have different search logic but share the same controller interface.

**How it works:** `SearchContext` holds a `SearchStrategy` interface. The controller injects the right strategy (`ServiceSearchStrategy`, `CropSearchStrategy`, or `ExpertSearchStrategy`) at runtime.

**UML Diagram:**
```
   «interface»
  SearchStrategy
  + search(params, prisma): Promise<Result>
        ▲
        │ implements
  ┌─────┴──────────────────┐
  │                        │
ServiceSearchStrategy  CropSearchStrategy
(filter by location,    (filter by crop type,
 category, title)        region, variety)

SearchContext
- strategy: SearchStrategy
+ execute(params, prisma)  ← delegates to strategy
```

**Where used:** `service.controller.ts` — when `?query=` or `?location=` params are present, `SearchContext` is instantiated with the appropriate strategy.

---

### 4. 👀 Observer Pattern

**File:** [`backend/src/patterns/observer/NotificationSubject.ts`](backend/src/patterns/observer/NotificationSubject.ts)

**Problem Solved:** Decouple business events (application submitted, complaint resolved) from their side effects (notifications, audit logs). Services shouldn't need to know how observers handle events.

**How it works:** `NotificationSubject` maintains a list of `Observer` implementations. When `notify(event)` is called, all registered observers are invoked asynchronously.

**UML Diagram:**
```
         «interface»
         Observer
  + update(event, prisma): Promise<void>
         ▲
         │ implements
  ┌──────┴──────────────┐
  │                     │
UserNotificationObserver  AuditLogObserver
(creates in-app +         (writes to audit_log
 socket notification)      table for admin review)

NotificationSubject
- observers: Observer[]
+ register(observer)
+ notify(event, prisma)  ← fans out to all observers
```

**Where used:** `application.service.ts` calls `appEventSubject.notify({ type: 'APPLICATION_APPROVED', ... })` after processing. Both notification and audit observers fire.

---

### 5. 🏛️ Facade Pattern

**File:** [`backend/src/patterns/facade/AdminDashboardFacade.ts`](backend/src/patterns/facade/AdminDashboardFacade.ts)

**Problem Solved:** The Admin dashboard requires data from 6+ tables. The facade hides all of that complexity behind three simple methods.

**How it works:** `AdminDashboardFacade` has `getDashboardStats()`, `getWeeklyStats()`, and `getGrowthMetrics()`. Each aggregates Prisma calls and returns a clean DTO.

**UML Diagram:**
```
   AdminService
       │
       │ uses
       ▼
AdminDashboardFacade
+ getDashboardStats()   ─── queries: user, providerComplaint,
+ getWeeklyStats()      ─── project, department, user.findMany
+ getGrowthMetrics()    ─── queries: user.groupBy, service.groupBy
+ getSubAdminStats()    ─── queries: userDepartment, complaint, application
+ getOfficerStats()     ─── queries: project, complaint, message, application
       │
       └── hides complexity from AdminController
```

**Where used:** `admin.service.ts` delegates all stat aggregation to the facade. The admin controller calls a single service method.

---

## 🧪 Software Testing

### Framework

- **Framework:** [Jest](https://jestjs.io/) + [ts-jest](https://kulshekhar.github.io/ts-jest/) + [jest-mock-extended](https://github.com/marchaos/jest-mock-extended)
- **Location:** `backend/tests/`
- **Run:** `cd backend && npm test`

### Test Stats

| Metric | Value |
|--------|-------|
| **Test Suites** | 26 passed |
| **Total Tests** | 265 passed |
| **Statements** | ≥ 93% |
| **Functions** | ≥ 91% |
| **Lines** | ≥ 93% |
| **Branches** | ≥ 84% |

### Coverage by File (Core Backend)

| File | Statements | Branches | Functions | Lines |
|------|-----------|---------|----------|-------|
| `admin.service.ts` | 100% | 100% | 100% | 100% |
| `auth.service.ts` | 100% | 91% | 100% | 100% |
| `application.service.ts` | 91% | 75% | 100% | 91% |
| `complaint.service.ts` | 96% | 100% | 100% | 96% |
| `service.service.ts` | 89% | 90% | 89% | 91% |
| `user.service.ts` | 100% | 89% | 100% | 100% |
| `notification.util.ts` | 100% | 100% | 100% | 100% |
| `apiResponse.ts` | 100% | 100% | 100% | 100% |
| `validators/index.ts` | 100% | 100% | 100% | 100% |
| `NotificationFactory.ts` | 100% | 100% | 100% | 100% |
| `SearchStrategy.ts` | 100% | 86% | 100% | 100% |
| `NotificationSubject.ts` | 100% | 83% | 100% | 100% |
| `application.repository.ts` | 100% | 100% | 100% | 100% |
| `service.repository.ts` | 100% | 100% | 100% | 100% |
| `complaint.repository.ts` | 100% | 100% | 100% | 100% |
| `user.repository.ts` | 100% | 100% | 100% | 100% |

### Test Structure

```
tests/
├── setup.ts                         # Global mock: PrismaClient, Logger
├── unit/
│   ├── services/
│   │   ├── auth.service.test.ts     # Register, login, token refresh
│   │   ├── admin.service.test.ts    # Dashboard, sub-admin, officer stats
│   │   ├── application.service.test.ts  # Submit, process, feedback, resubmit
│   │   ├── complaint.service.test.ts    # Submit, update status (RBAC)
│   │   ├── service.service.test.ts      # Create, list, approve
│   │   └── user.service.test.ts         # Profile, list users, toggle status
│   ├── controllers/
│   │   ├── auth.controller.test.ts
│   │   ├── application.controller.test.ts
│   │   ├── complaint.controller.test.ts
│   │   ├── service.controller.test.ts
│   │   └── user.controller.test.ts
│   ├── repositories/
│   │   ├── user.repository.test.ts
│   │   └── repositories.test.ts     # Application, Service, Complaint repos
│   ├── patterns/
│   │   ├── singleton.test.ts        # DatabaseManager singleton
│   │   ├── factory.test.ts          # NotificationFactory
│   │   ├── strategy.test.ts         # SearchContext with all strategies
│   │   ├── observer.test.ts         # NotificationSubject + observers
│   │   ├── facade.test.ts           # AdminDashboardFacade
│   │   └── design-patterns.test.ts  # Cross-pattern integration test
│   ├── middleware/
│   │   └── middleware.test.ts       # Auth, validate, error middleware
│   └── utils/
│       ├── jwt.test.ts              # Token sign/verify roundtrips
│       ├── bcrypt.test.ts           # Hash/compare
│       ├── apiResponse.test.ts      # sendSuccess/sendError shapes
│       └── notification.util.test.ts  # SSE push, socket.io push
└── integration/
    ├── api.test.ts                  # Full HTTP round-trip (auth, services)
    └── agriculture.test.ts          # Market price, crop advisory
```

### Mocking Strategy

- **Database:** `jest-mock-extended` generates a `DeepMockProxy<PrismaClient>` in `tests/setup.ts`. Every service test uses `prismaMock` — **no real database calls**.
- **Observers / Notifications:** `jest.spyOn(appEventSubject, 'notify')` prevents real notifications firing.
- **Controllers:** `jest.spyOn(ServiceName.prototype, 'method')` — intercepting module-level singletons created at load time.
- **Socket.io / SSE:** Mocked via `jest.mock('../../../src/utils/socket')`.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- SQLite (for development) or PostgreSQL

### Backend Setup

```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed-rbac.ts
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `.env` in `backend/`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=4000
FRONTEND_URL="http://localhost:5173"
GROQ_API_KEY="your-groq-api-key"  # Optional, for AI features
```

### Run Tests

```bash
cd backend
npm test               # Run all tests with coverage report
npm test -- --watch    # Watch mode for development
```

---

## 📡 Real-Time Features (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:message` | Client → Server | Send a chat message |
| `chat:message` | Server → Client | Receive a chat message |
| `chat:typing` | Client → Server | User is typing indicator |
| `chat:read` | Client → Server | Mark messages as read |
| `chat:read` | Server → Client | Read receipt notification |
| `community:post` | Server → Client | New community post broadcast |
| `join_user` | Client → Server | Join personal notification room |
| `join_department` | Client → Server | Join department chat room |
| `notification` | Server → Client | Real-time in-app notification |

---

## 📄 License

MIT License — PolliBondhu Smart Village Platform
