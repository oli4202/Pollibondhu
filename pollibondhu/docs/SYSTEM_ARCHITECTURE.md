# System Architecture (SYSTEM_ARCHITECTURE.md)
## PolliBondhu — Technical Architecture Overview

**Version:** 2.0  
**Date:** August 2026  

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Desktop  │  │ Mobile   │  │ Tablet   │  │ Future   │   │
│  │ Browser  │  │ Browser  │  │ Browser  │  │ Mobile   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │ App      │   │
│       └──────────────┴──────────────┘        └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / WSS
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                     NGINX REVERSE PROXY                      │
│              (Rate Limiting, SSL, Static Files)               │
└──────────┬───────────────────────────────┬───────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────┐            ┌──────────────────────────┐
│   FRONTEND CDN   │            │     BACKEND API          │
│   (Static Files) │            │   (Express + Socket.io)  │
│   React + Vite   │            │   Port: 4000             │
└──────────────────┘            └────────┬─────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
           ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
           │  PostgreSQL  │    │   Groq AI    │    │  File Storage│
           │  Database    │    │   Service    │    │  (Local/S3)  │
           │  Port: 5432  │    │              │    │              │
           └──────────────┘    └──────────────┘    └──────────────┘
```

---

## 2. Backend Architecture

### 2.1 Layer Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     HTTP REQUEST                          │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                     ROUTES                                │
│  auth.routes  user.routes  service.routes  complaint...  │
│  admin.routes  agriculture.routes  aiRoutes              │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   MIDDLEWARE                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Helmet    │ │RateLimit │ │CORS      │ │Validate  │   │
│  │Security  │ │100/15min │ │Origin    │ │Zod Schema│   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │Auth      │ │Require   │ │Require   │                 │
│  │JWT       │ │Role      │ │Department│                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  CONTROLLERS                              │
│  Thin HTTP layer: parse request → call service → respond │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │auth.ctrl   │ │user.ctrl   │ │service.ctrl│          │
│  └────────────┘ └────────────┘ └────────────┘          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │complaint   │ │admin.ctrl  │ │agriculture │          │
│  └────────────┘ └────────────┘ └────────────┘          │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   SERVICES                                │
│  Business logic, orchestration, patterns                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │auth.svc    │ │user.svc    │ │service.svc │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │complaint   │ │admin.svc   │ │ai.svc      │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │messaging   │ │project     │ │notification│          │
│  └────────────┘ └────────────┘ └────────────┘          │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  REPOSITORIES                              │
│  Database access layer (Prisma abstraction)               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │user.repo   │ │service.repo│ │complaint   │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │application │ │message.repo│ │project.repo│          │
│  └────────────┘ └────────────┘ └────────────┘          │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                DESIGN PATTERNS                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │Singleton │ │Factory   │ │Strategy  │                 │
│  │(DB, Log) │ │(Notif)   │ │(Search)  │                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
│  ┌──────────┐ ┌──────────┐                               │
│  │Observer  │ │Facade    │                               │
│  │(Events)  │ │(Dashboard│                               │
│  └──────────┘ └──────────┘                               │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│              PRISMA ORM + PostgreSQL                      │
│  Connection Pool → Parameterized Queries → Database       │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Socket.io Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  SOCKET.IO SERVER                         │
│              (Integrated with Express)                     │
└──────────┬───────────────────────────────┬───────────────┘
           │                               │
           ▼                               ▼
┌──────────────────┐            ┌──────────────────────────┐
│  EVENT HANDLERS  │            │     ROOM MANAGEMENT      │
│                  │            │                          │
│ join_department  │            │ dept_{department_id}     │
│ send_message     │            │ conv_{conversation_id}   │
│ typing_start     │            │ user_{user_id}           │
│ typing_stop      │            │                          │
│ message_read     │            │                          │
│ disconnect       │            │                          │
└────────┬─────────┘            └──────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│              MESSAGE PERSISTENCE                          │
│  Socket Event → Validate → Save to DB → Broadcast        │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 Component Hierarchy

```
<App>
  <QueryClientProvider>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/agriculture" element={<Agriculture />} />
              <Route path="/services" element={<Services />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/community" element={<Community />} />
              <Route path="/healthcare" element={<Healthcare />} />
              <Route path="/education" element={<Education />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/news" element={<News />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Citizen Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/dashboard/profile" element={<Profile />} />
              <Route path="/dashboard/applications" element={<MyApplications />} />
              <Route path="/dashboard/complaints" element={<MyComplaints />} />
              <Route path="/dashboard/messages" element={<Messages />} />
              <Route path="/dashboard/notifications" element={<Notifications />} />
            </Route>

            {/* Officer Routes */}
            <Route element={<OfficerLayout />}>
              <Route path="/officer" element={<OfficerDashboard />} />
              <Route path="/officer/applications" element={<OfficerApplications />} />
              <Route path="/officer/complaints" element={<OfficerComplaints />} />
              <Route path="/officer/messages" element={<OfficerMessages />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<RoleBasedDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/departments" element={<DepartmentManagement />} />
              <Route path="/admin/services" element={<ServiceManagement />} />
              <Route path="/admin/complaints" element={<ComplaintManagement />} />
              <Route path="/admin/projects" element={<ProjectManagement />} />
              <Route path="/admin/budgets" element={<BudgetManagement />} />
              <Route path="/admin/audit" element={<AuditLogs />} />
            </Route>
          </Routes>
          
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
</App>
```

### 3.2 Data Flow Pattern

```
┌──────────────────────────────────────────────────────────┐
│                    PAGE COMPONENT                         │
│  const { data, isLoading, error } = useQuery({           │
│    queryKey: ['applications', filters],                  │
│    queryFn: () => api.get('/applications', { params })   │
│  });                                                     │
└──────────┬───────────────────────────────┬───────────────┘
           │                               │
           ▼                               ▼
┌──────────────────┐            ┌──────────────────────────┐
│  TanStack Query  │            │     Optimistic Updates   │
│  Cache Layer     │            │                          │
│  - Stale Time    │            │  useMutation →           │
│  - Refetch       │            │  onMutate → update cache │
│  - Background    │            │  onError → rollback      │
│    Refetch       │            │  onSettled → refetch     │
└────────┬─────────┘            └──────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│              AXIOS HTTP CLIENT                            │
│  - Base URL from env                                     │
│  - JWT interceptor (adds Bearer token)                   │
│  - Error interceptor (401 → redirect to login)           │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND API (Express)                        │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│  LOGIN FLOW                                              │
│                                                          │
│  1. User enters email + password                         │
│  2. POST /api/auth/login                                 │
│  3. Backend validates credentials                        │
│  4. Backend generates:                                   │
│     - Access token (15 min, JWT with user_id, role)     │
│     - Refresh token (7 days, stored in DB)               │
│  5. Response: { user, accessToken, refreshToken }        │
│  6. Frontend stores both in localStorage                 │
│  7. Axios interceptor adds Bearer token to all requests  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  TOKEN REFRESH FLOW                                      │
│                                                          │
│  1. Axios interceptor catches 401 response               │
│  2. Check if refreshToken exists in localStorage         │
│  3. POST /api/auth/refresh { refreshToken }              │
│  4. Backend validates refresh token against DB           │
│  5. If valid: issue new access token                     │
│  6. If invalid/expired: redirect to login                │
│  7. Retry original request with new token                │
└──────────────────────────────────────────────────────────┘
```

---

## 5. RBAC Enforcement Flow

```
┌──────────────────────────────────────────────────────────┐
│  REQUEST → authMiddleware                                 │
│                                                          │
│  1. Extract Bearer token from Authorization header       │
│  2. Verify JWT signature and expiry                      │
│  3. Decode payload: { user_id, email, role }             │
│  4. Attach to req.user                                   │
│  5. Next middleware: requireRole('ADMIN', 'SUPER_ADMIN') │
│                                                          │
│  MIDDLEWARE CHECK:                                       │
│  ├── req.user exists? → 401 if not                       │
│  ├── req.user.role in allowed roles? → 403 if not        │
│  ├── Department check:                                   │
│  │   ├── SUPER_ADMIN → pass                              │
│  │   ├── Check req.user.department_id matches resource   │
│  │   └── SUB_ADMIN with matching department → pass       │
│  └── Location check:                                     │
│      ├── SUPER_ADMIN → pass                              │
│      ├── Check user_locations for access                 │
│      └── Officer location matches resource → pass        │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Deployment Architecture

### 6.1 Development
```
┌─────────────────────────────────────────────┐
│  Docker Compose                             │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ frontend │  │ backend  │  │ postgres │ │
│  │ :5173    │  │ :4000    │  │ :5432    │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  Volumes: mount source for hot reload       │
└─────────────────────────────────────────────┘
```

### 6.2 Production
```
┌─────────────────────────────────────────────┐
│  Production Environment                     │
│                                             │
│  ┌──────────┐                               │
│  │  Nginx   │ ← SSL termination             │
│  │  :443    │ ← Static file serving         │
│  └────┬─────┘ ← Reverse proxy               │
│       │                                     │
│  ┌────┴─────┐  ┌──────────┐  ┌──────────┐ │
│  │ frontend │  │ backend  │  │ postgres │ │
│  │ (static) │  │ :4000    │  │ :5432    │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │  Redis   │  │ File     │                │
│  │ (cache)  │  │ Storage  │                │
│  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────┘
```

---

## 7. Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                        │
│                                                          │
│  Layer 1: Network                                        │
│  ├── HTTPS/TLS encryption                                │
│  ├── CORS origin restriction                             │
│  └── Rate limiting (100 req/15min)                       │
│                                                          │
│  Layer 2: HTTP                                           │
│  ├── Helmet security headers                             │
│  ├── Content-Type validation                             │
│  └── Request size limits                                 │
│                                                          │
│  Layer 3: Authentication                                 │
│  ├── JWT access tokens (15 min)                          │
│  ├── Refresh tokens (7 days, DB stored)                  │
│  ├── bcrypt password hashing (12 rounds)                 │
│  └── Account lockout (5 failed attempts)                 │
│                                                          │
│  Layer 4: Authorization                                  │
│  ├── Role-based access (RBAC)                            │
│  ├── Permission-based checks                             │
│  ├── Department scoping                                  │
│  └── Location scoping                                    │
│                                                          │
│  Layer 5: Input                                          │
│  ├── Zod schema validation                               │
│  ├── Prisma parameterized queries (no SQL injection)     │
│  ├── React XSS escaping (default)                        │
│  └── File upload type/size validation                    │
│                                                          │
│  Layer 6: Data                                           │
│  ├── Password hash never returned in API                 │
│  ├── Sensitive fields excluded from queries              │
│  ├── Audit trail for admin actions                       │
│  └── Environment variables for secrets                   │
│                                                          │
│  Layer 7: AI                                             │
│  ├── Same RBAC rules as REST API                         │
│  ├── System prompt enforces role awareness               │
│  ├── No data access beyond user permissions              │
│  └── Response filtering before display                   │
└──────────────────────────────────────────────────────────┘
```

---

## 8. File Structure

```
pollibondhu/
├── backend/
│   ├── src/
│   │   ├── app.ts                    # Express + Socket.io setup
│   │   ├── config/
│   │   │   └── env.ts               # ConfigManager singleton
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT + RBAC
│   │   │   ├── error.middleware.ts   # Global error handler
│   │   │   └── validate.middleware.ts # Zod validation
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── service.routes.ts
│   │   │   ├── application.routes.ts
│   │   │   ├── complaint.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── agriculture.routes.ts
│   │   │   ├── education.routes.ts
│   │   │   ├── ngo.routes.ts
│   │   │   ├── messaging.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   ├── waste.routes.ts
│   │   │   ├── emergency.routes.ts
│   │   │   └── ai.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── service.controller.ts
│   │   │   ├── application.controller.ts
│   │   │   ├── complaint.controller.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── agriculture.controller.ts
│   │   │   ├── education.controller.ts
│   │   │   ├── ngo.controller.ts
│   │   │   ├── messaging.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── project.controller.ts
│   │   │   ├── waste.controller.ts
│   │   │   ├── emergency.controller.ts
│   │   │   └── ai.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── service.service.ts
│   │   │   ├── application.service.ts
│   │   │   ├── complaint.service.ts
│   │   │   ├── admin.service.ts
│   │   │   ├── agriculture.service.ts
│   │   │   ├── education.service.ts
│   │   │   ├── ngo.service.ts
│   │   │   ├── messaging.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── waste.service.ts
│   │   │   ├── emergency.service.ts
│   │   │   └── ai.service.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   ├── service.repository.ts
│   │   │   ├── complaint.repository.ts
│   │   │   ├── application.repository.ts
│   │   │   ├── messaging.repository.ts
│   │   │   ├── project.repository.ts
│   │   │   └── notification.repository.ts
│   │   ├── patterns/
│   │   │   ├── singleton/
│   │   │   │   ├── DatabaseManager.ts
│   │   │   │   └── Logger.ts
│   │   │   ├── factory/
│   │   │   │   └── NotificationFactory.ts
│   │   │   ├── strategy/
│   │   │   │   └── SearchStrategy.ts
│   │   │   ├── observer/
│   │   │   │   └── NotificationSubject.ts
│   │   │   └── facade/
│   │   │       ├── AdminDashboardFacade.ts
│   │   │       └── CitizenDashboardFacade.ts
│   │   ├── validators/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── apiResponse.ts
│   │       ├── bcrypt.ts
│   │       └── jwt.ts
│   ├── tests/
│   │   ├── setup.ts
│   │   ├── mocks/
│   │   │   └── data.mock.ts
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   ├── patterns/
│   │   │   └── controllers/
│   │   └── integration/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── ui/           # Button, Card, Badge, Table, Modal, Tabs, etc.
│   │   │   ├── layout/       # PublicLayout, DashboardLayout, AdminLayout
│   │   │   ├── auth/         # RequireAuthButton
│   │   │   ├── chat/         # AiChatWidget, InternalMessaging
│   │   │   ├── feedback/     # ToastProvider, ConfirmDialog
│   │   │   └── forms/        # FormField, FormSelect, FormTextarea
│   │   ├── pages/
│   │   │   ├── public/       # Home, Agriculture, Services, etc.
│   │   │   ├── auth/         # Login, Register
│   │   │   ├── citizen/      # Dashboard, Profile, Applications, Complaints
│   │   │   ├── officer/      # OfficerDashboard, TaskList
│   │   │   └── admin/        # AdminDashboard, UserManagement, etc.
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/            # useAuth, useApi, useToast, useAIHelper
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── rbac.ts
│   │   └── utils/
│   │       ├── api.ts
│   │       └── cn.ts
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── docs/                     # Planning documents
├── docker-compose.yml
└── README.md
```

---

## 9. Data Flow Summary

| Flow | Client → API → DB → Response |
|------|------------------------------|
| Login | POST /auth/login → AuthService.login() → UserRepo.findByEmail() → JWT tokens |
| Apply Service | POST /applications → ApplicationService.create() → ApplicationRepo.create() → Notification |
| File Complaint | POST /complaints → ComplaintService.submit() → ComplaintRepo.create() → Observer.notify() |
| Send Message | WS send_message → MessageService.save() → MessageRepo.create() → WS broadcast |
| AI Query | POST /ai/chat → AIService.query() → RBAC check → Groq API → Filtered response |
| Admin Dashboard | GET /admin/dashboard → Facade.getDashboardStats() → Multiple Repos → Aggregated DTO |
