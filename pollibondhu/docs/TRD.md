# Technical Requirements Document (TRD)
## PolliBondhu Platform

**Version:** 2.0  
**Date:** August 2026  

---

## 1. Technology Stack

### 1.1 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| React Router | 6.x | Client-side routing |
| TanStack Query | 5.x | Server state management, caching |
| Axios | 1.x | HTTP client |
| Socket.io Client | 4.x | Real-time communication |
| Recharts | 2.x | Data visualization |
| Lucide React | 0.395+ | Icon library |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| clsx + tailwind-merge | — | Conditional class merging |

### 1.2 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime |
| Express | 4.x | HTTP framework |
| TypeScript | 5.x | Type safety |
| Prisma | 5.x | ORM & database access |
| PostgreSQL | 15+ | Primary database |
| jsonwebtoken | 9.x | JWT auth |
| bcryptjs | 2.x | Password hashing |
| Zod | 3.x | Input validation |
| Winston | 3.x | Structured logging |
| Helmet | 7.x | HTTP security headers |
| express-rate-limit | 7.x | API rate limiting |
| Socket.io | 4.x | Real-time WebSocket |
| Groq SDK | 1.x | AI assistant |
| multer | — | File upload handling |
| cors | 2.x | Cross-origin requests |
| dotenv | 16.x | Environment variables |

### 1.3 Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| Jest | 29.x | Test runner |
| Supertest | 7.x | HTTP integration testing |
| jest-mock-extended | 3.x | Prisma client mocking |
| @faker-js/faker | 8.x | Test data generation |
| ts-jest | 29.x | TypeScript support |

### 1.4 DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-service orchestration |
| PostgreSQL 15 Alpine | Database container |

---

## 2. Architecture Requirements

### 2.1 Backend Architecture
```
Request → Router → Middleware (Auth, RBAC, Validation) → Controller → Service → Repository → Prisma → PostgreSQL
```

**Layers:**
- **Routes**: Define endpoints and HTTP methods
- **Middleware**: Authentication, RBAC, input validation, error handling
- **Controllers**: Thin HTTP layer — parse request, call service, send response
- **Services**: Business logic, orchestration, pattern implementations
- **Repositories**: Database queries, abstracted behind interfaces

**Rules:**
- Controllers must never contain business logic
- Services must never directly use `req`/`res` objects
- Repositories must abstract all Prisma calls
- All external input must be validated with Zod
- All errors must be caught and formatted consistently

### 2.2 Frontend Architecture
```
Route → Layout → Page → Components → API Calls (TanStack Query) → Backend
```

**Layers:**
- **Routes**: URL mapping with role guards
- **Layouts**: PublicLayout, DashboardLayout, AdminLayout (sidebar + header)
- **Pages**: Full-page views for each feature
- **Components**: Reusable UI components (Button, Card, Table, etc.)
- **Contexts**: AuthContext (user state, permissions), ToastContext
- **Hooks**: Custom hooks for reusable logic
- **Utils**: API client, class merging, constants
- **Types**: Shared TypeScript interfaces

### 2.3 Real-Time Architecture
```
Socket.io Server ←→ Socket.io Client
     ↓
Event handlers → Database persistence → Observer notifications
```

**Requirements:**
- WebSocket connection authenticated via JWT
- Messages persisted to database
- Department-based room join
- Typing indicators
- Read/delivered status
- Reconnection handling

---

## 3. Database Requirements

### 3.1 Database
- **Engine**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Charset**: UTF-8 (Bengali support)
- **Naming**: snake_case for tables and columns

### 3.2 Schema Design Principles
- Primary keys: auto-incrementing integers
- Foreign keys: explicit with proper referential actions
- Timestamps: `created_at` (default now()), `updated_at` (auto-update)
- Soft deletion: `deleted_at` (nullable DateTime) where appropriate
- Status fields: string enums with validation
- JSON fields: for flexible metadata
- Unique constraints: on natural keys (email, phone, NID)
- Indexes: on frequently queried foreign keys and status fields

### 3.3 RBAC Schema
```
users ← user_roles → roles ← role_permissions → permissions
                        ↓
                   departments ← user_departments
                        ↓
                    locations ← user_locations
```

### 3.4 Data Volume Estimates
| Entity | Year 1 | Year 3 |
|--------|--------|--------|
| Users | 100K | 1M |
| Services | 5K | 50K |
| Applications | 50K | 500K |
| Complaints | 20K | 200K |
| Messages | 500K | 10M |
| Notifications | 1M | 20M |
| Audit Logs | 200K | 5M |

---

## 4. API Requirements

### 4.1 Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "error": "Error string if failed",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### 4.2 Authentication
- **Registration**: POST /api/auth/register (public)
- **Login**: POST /api/auth/login → access token (15min) + refresh token (7 days)
- **Refresh**: POST /api/auth/refresh → new access token
- **Logout**: POST /api/auth/logout → invalidate refresh token

### 4.3 RBAC Enforcement
- Every protected endpoint must verify JWT
- Role-based endpoints must check role assignment
- Department-scoped endpoints must verify department membership
- Location-scoped endpoints must verify location access
- AI assistant must enforce same RBAC rules as REST API

### 4.4 Pagination
All list endpoints must support:
```
GET /api/resource?page=1&limit=10&search=query&sort=field&order=desc
```

### 4.5 File Upload
- Multer for handling multipart/form-data
- Storage: local filesystem (development), S3-compatible (production)
- Allowed types: images (jpg, png, webp), documents (pdf, doc)
- Max size: 5MB per file
- Max files per request: 5

---

## 5. Security Requirements

### 5.1 Authentication
- Passwords hashed with bcrypt (12 salt rounds)
- JWT access tokens: 15-minute expiry
- JWT refresh tokens: 7-day expiry, stored in database
- Refresh token rotation on use
- Account lockout after 5 failed attempts (15-minute window)

### 5.2 Authorization
- RBAC enforced at middleware level
- No data leakage across roles
- Citizen private data never exposed to admin roles without explicit permission
- AI assistant respects same RBAC rules

### 5.3 Input Validation
- All request bodies validated with Zod
- SQL injection prevented by Prisma parameterized queries
- XSS prevented by React's default escaping
- CSRF: SameSite cookies + CORS origin restriction

### 5.4 Rate Limiting
- Global: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes
- AI endpoints: 20 requests per 15 minutes

### 5.5 Secrets Management
- All secrets in environment variables
- No hardcoded credentials in code
- `.env` files excluded from version control
- JWT secrets must be 32+ characters

---

## 6. Performance Requirements

| Metric | Target |
|--------|--------|
| API response time (p50) | <200ms |
| API response time (p95) | <500ms |
| Frontend LCP | <3s on 3G |
| Frontend FID | <100ms |
| Database query time | <100ms (p95) |
| WebSocket latency | <200ms |
| Concurrent users | 1,000+ |

### 6.1 Optimization Strategies
- **Database**: Proper indexing, connection pooling, query optimization
- **API**: Response caching (TanStack Query), pagination, field selection
- **Frontend**: Code splitting, lazy loading, image optimization
- **WebSocket**: Room-based broadcasting, message batching

---

## 7. Scalability Requirements

### 7.1 Horizontal Scaling
- Stateless API servers (session in JWT)
- Database read replicas for heavy read workloads
- WebSocket adapter for multi-server (Redis adapter)

### 7.2 Vertical Scaling
- Connection pooling (PgBouncer)
- Query optimization
- Database partitioning for large tables (audit_logs, messages)

---

## 8. Monitoring & Observability

- **Logging**: Winston structured JSON logs (info, warn, error)
- **Audit Trail**: All admin actions logged to audit_logs table
- **Error Tracking**: Centralized error middleware with stack traces
- **Health Check**: GET /health endpoint
- **Metrics**: Request count, response time, error rate

---

## 9. Deployment Requirements

### 9.1 Docker
- Multi-stage Dockerfiles for both frontend and backend
- Docker Compose for local development
- Production: separate containers with nginx reverse proxy

### 9.2 Environment Configuration
```env
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
GROQ_API_KEY=...

# Optional
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

---

## 10. Code Quality Requirements

- **TypeScript strict mode**: Enabled for both frontend and backend
- **ESLint**: Enforced with consistent rules
- **Prettier**: Consistent formatting
- **No `any` types**: Proper typing required
- **No placeholder buttons**: All UI actions must have real implementations
- **No hardcoded mock data**: All data from API
- **Consistent error handling**: All errors caught and formatted
- **Mobile responsive**: All pages must work on 320px+ screens
