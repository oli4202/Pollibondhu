# 🌾 PolliBondhu — Smart Village Platform

A comprehensive digital platform for rural Bangladesh connecting citizens, service providers, government officers, and NGOs.

---

## 🏗️ Architecture

```
pollibondhu/
├── backend/          # Express.js + Prisma + Socket.io
│   ├── src/
│   │   ├── config/           # Environment configuration
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── patterns/         # Design patterns (Singleton, Strategy)
│   │   ├── repositories/     # Database access layer
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utilities (JWT, upload, API response)
│   │   └── validators/       # Request validation schemas
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
ADMIN (1) — Full system access
  ├── OFFICER (many) — Department-level management
  ├── SERVICE_PROVIDER (many) — Service offerings
  ├── GOV_SERVICE_PROVIDER (many) — Government services
  ├── NGO_ADMIN (many) — NGO programmes
  ├── INSTITUTION_ADMIN (many) — Educational institutions
  ├── TEACHER (many) — Course management
  └── CITIZEN (many) — Basic user access
```

### Role Details

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **ADMIN** | Full system administrator. Manages all users, departments, services, and system settings. Only one admin is needed. | ALL permissions — user CRUD, role management, settings, audit, departments, services, complaints, budget, projects |
| **OFFICER** | Government officer assigned to a department. Handles complaints, applications, and department activities. | View/update complaints, process applications, manage department chat, view agriculture/education data |
| **SERVICE_PROVIDER** | Private service provider. Creates and manages services for citizens (e.g., tractor rental, repair services). | Create/update/delete own services, messaging |
| **GOV_SERVICE_PROVIDER** | Government service provider. Manages official services (NID, birth certificate, trade license, etc.). | Create/update/delete government services, process/approve applications, broadcast notifications |
| **NGO_ADMIN** | NGO administrator. Manages NGO programmes, donations, and community events. | Manage NGO programmes, create events, manage donations, education |
| **INSTITUTION_ADMIN** | Educational institution administrator. Manages courses, students, and institution data. | Manage institution, create courses, enroll students |
| **TEACHER** | Teacher at an educational institution. Manages courses and views student data. | View/manage courses, view students |
| **CITIZEN** | Regular citizen. Files complaints, applies for services, participates in community forum. | Create/view complaints, apply for services, community posts, AI chat, agriculture data |

---

## 🏛️ Departments

| Department | Responsibilities | Officers |
|------------|-----------------|----------|
| **Agriculture** | Farming advice, crop management, irrigation, fertilizer supply, pest control | Agricultural Officers |
| **Health** | Healthcare services, vaccination camps, disease prevention, maternal health | Health Officers |
| **Education** | School management, scholarships, teacher training, student enrollment | Education Officers |
| **Infrastructure** | Roads, bridges, drainage, electricity, water supply, construction | Infrastructure Officers |
| **Law & Order** | Safety, crime prevention, dispute resolution, community policing | Police, Legal Officers |
| **Environment** | Pollution control, waste management, tree plantation, environmental protection | Environment Officers |
| **Emergency** | Flood response, fire safety, disaster management, emergency contacts | Emergency Coordinators |

---

## 🔐 RBAC System

### Permission Structure

Permissions follow the format: `module.action`

**Modules:** user, role, permission, department, service, application, complaint, project, budget, dashboard, message, agriculture, education, institution, course, student, ngo, programme, notification, event, news, waste, emergency, audit, settings, ai

### How It Works

1. **Database-driven**: Roles and permissions are stored in the database (`roles`, `permissions`, `role_permissions` tables)
2. **User assignment**: Users are assigned roles via `user_roles` table
3. **Permission resolution**: When a user logs in, their permissions are loaded from all assigned roles and cached for 5 minutes
4. **Middleware checks**: API endpoints use `requirePermission()` or `requireAnyPermission()` middleware
5. **ADMIN bypass**: The ADMIN role automatically bypasses all permission checks

### Seeding RBAC

```bash
cd backend
npx ts-node prisma/seed-rbac.ts
```

This creates all roles and permissions in the database.

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

---

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

---

## 📄 License

MIT License — PolliBondhu Smart Village Platform
