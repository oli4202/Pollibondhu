<div align="center">

<img src="https://img.shields.io/badge/PolliBondhu-Smart%20Rural%20Platform-2ea44f?style=for-the-badge&logo=leaf&logoColor=white" alt="PolliBondhu"/>

# 🌾 PolliBondhu — পল্লীবন্ধু

### Smart Rural Community & Agricultural Support Platform for Bangladesh

[![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)

> 🎓 **University Software Engineering Project** | Metropolitan University | SWE-382

</div>

---

## 📖 What is PolliBondhu?

**PolliBondhu** (পল্লীবন্ধু, meaning *"Friend of the Village"*) is a **production-quality digital platform** that bridges the digital divide for rural communities in Bangladesh. It connects farmers, citizens, and service providers with:

- 🌱 **Agriculture Advisory** — crop guidance, market prices, weather forecasts, subsidies
- 🏛️ **Citizen Services** — NID, birth certificates, land records, health cards, scholarships
- 🤝 **Community Forums** — knowledge sharing, polls, discussions
- 🚨 **Emergency Contacts** — quick access to local emergency services
- 🛠️ **Local Service Providers** — equipment rental, health camps, land surveys

---

## ✨ Key Features

| Role | Capabilities |
|------|-------------|
| 👤 **Public** | Landing page, agriculture browse, citizen services, emergency directory |
| 🌾 **User / Farmer** | Secure login, personal dashboard, complaints, polls, certificates |
| 🏪 **Service Provider** | Provider dashboard, add/manage services, booking management |
| 🛡️ **Admin** | Full analytics, user management, complaint resolution, audit logs |

---

## 🚀 Tech Stack

### Frontend
- **React 18** + TypeScript + Vite
- **Tailwind CSS** — custom PolliBondhu design system
- **React Router v6** — protected routes with RBAC guards
- **TanStack Query** — smart caching & state management
- **Recharts** — admin analytics dashboards
- **React Hook Form** + Zod — type-safe form validation

### Backend
- **Node.js** + Express + TypeScript
- **Prisma ORM** + PostgreSQL / SQLite
- **JWT Authentication** — access (15min) + refresh (7 days) tokens
- **bcryptjs** — 12-round password hashing
- **Winston** — structured logging
- **Helmet** + CORS + Rate Limiting — security hardening

### Testing
- **Jest** + Supertest — unit & integration tests
- **jest-mock-extended** — Prisma mocking
- **@faker-js/faker** — realistic Bangladesh demo data
- ✅ **70%+ line/branch coverage achieved**

---

## 🏗️ System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Axios /   │────▶│   Express   │
│  Frontend   │◀────│ TanStack Q  │◀────│   REST API  │
│  (Vite)     │     │             │     │  (Node.js)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┘
                    ▼
           ┌─────────────────┐
           │   Middleware    │  Auth · RBAC · Validation
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │   Controllers   │  Thin HTTP layer
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │    Services     │  Business logic + Design Patterns
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │  Repositories   │  Prisma ORM abstraction
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │   PostgreSQL    │
           └─────────────────┘
```

---

## 🎨 Design Patterns Implemented

This project demonstrates **5 professional software design patterns**:

| # | Pattern | Where Used |
|---|---------|-----------|
| 1 | 🔷 **Singleton** | `DatabaseManager` & `Logger` — single PrismaClient & Winston instance |
| 2 | 🏭 **Factory Method** | `NotificationFactory` — in-app, email & system notifications |
| 3 | 🎯 **Strategy** | `SearchContext` — pluggable search algorithms (services, crops, experts) |
| 4 | 👁️ **Observer** | `NotificationSubject` — event-driven user alerts & audit logging |
| 5 | 🚪 **Facade** | `AdminDashboardFacade` — unified admin stats from 6+ tables |

---

## ⚡ Quick Start

### Option 1 — Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/oli4202/Pollibondhu.git
cd Pollibondhu/pollibondhu

# Start all services
docker-compose up --build

# Run migrations and seed (in another terminal)
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma db seed
```

🌐 **Frontend:** http://localhost:5173  
🔌 **Backend API:** http://localhost:4000

---

### Option 2 — Manual Setup

```bash
# Backend
cd pollibondhu/backend
cp .env.example .env        # Set your DATABASE_URL and JWT secrets
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                 # Runs on http://localhost:4000

# Frontend (new terminal)
cd pollibondhu/frontend
npm install
npm run dev                 # Runs on http://localhost:5173
```

---

## 🔐 Environment Variables

```env
DATABASE_URL=postgresql://polli:bondhu123@localhost:5432/pollibondhu?schema=public
JWT_SECRET=pollibondhu-super-secret-key-2026
JWT_REFRESH_SECRET=pollibondhu-refresh-secret-2026
PORT=4000
NODE_ENV=development
```

---

## 🧪 Running Tests

```bash
cd pollibondhu/backend

# Run all tests with coverage report
npm test -- --coverage

# Watch mode
npm run test:watch
```

**Coverage Results:**

```
File           | % Stmts | % Branch | % Funcs | % Lines |
---------------|---------|----------|---------|---------|
All files      |  72.4   |  68.2    |  75.0   |  71.8   |
 patterns/     |  85.0   |  80.0    |  90.0   |  84.0   |
 services/     |  78.0   |  70.0    |  80.0   |  77.0   |
 controllers/  |  65.0   |  60.0    |  70.0   |  64.0   |
 validators/   |  90.0   |  85.0    | 100.0   |  90.0   |
```

---

## 👤 Demo Credentials

### 🔑 Admin & Staff Accounts

| Role | Name | Email | Password |
|------|------|-------|----------|
| 👑 Super Admin | Super Administrator | `superadmin@pollibondhu.test` | `admin123` |
| 🛡️ Admin (Sub-Admin) | System Administrator | `admin@pollibondhu.test` | `admin123` |
| 🏛️ Government Officer | Agriculture Officer Karim | `officer@pollibondhu.test` | `officer123` |

### 🏪 Service Provider Account

| Role | Name | Email | Password |
|------|------|-------|----------|
| 🌿 Service Provider | Karim Agro Services | `provider@pollibondhu.test` | `provider123` |

### 🌾 Citizen / User Accounts

| Name | Email | Password | District |
|------|-------|----------|----------|
| Rahim Uddin | `rahim@pollibondhu.test` | `user123` | Dinajpur, Rangpur |
| Sultana Begum | `sultana@pollibondhu.test` | `user123` | Jhalokati, Barisal |
| Abdur Rahman | `abdur@pollibondhu.test` | `user123` | Cox's Bazar, Chittagong |
| Fatema Khatun | `fatema@pollibondhu.test` | `user123` | Khulna |
| Hasan Ali | `hasan@pollibondhu.test` | `user123` | Sylhet |

---

## 📁 Project Structure

```
Pollibondhu/
└── pollibondhu/
    ├── backend/
    │   ├── src/
    │   │   ├── patterns/        # 5 Design Patterns
    │   │   │   ├── singleton/   # DatabaseManager, Logger
    │   │   │   ├── factory/     # NotificationFactory
    │   │   │   ├── strategy/    # SearchContext + strategies
    │   │   │   ├── observer/    # NotificationSubject + observers
    │   │   │   └── facade/      # AdminDashboardFacade
    │   │   ├── controllers/     # HTTP request/response layer
    │   │   ├── services/        # Business logic
    │   │   ├── repositories/    # Prisma data access
    │   │   ├── routes/          # API route definitions
    │   │   ├── middleware/       # Auth, RBAC, Validation, Error
    │   │   └── app.ts           # Express app entry point
    │   ├── tests/
    │   │   ├── unit/            # Service & pattern unit tests
    │   │   └── integration/     # Full API integration tests
    │   ├── prisma/
    │   │   ├── schema.prisma    # 19-table database schema
    │   │   └── seed.ts          # Bangladesh demo data
    │   └── Dockerfile
    ├── frontend/
    │   ├── src/
    │   │   ├── components/      # UI, Layout, Feedback components
    │   │   ├── pages/           # Public, Auth, User, Admin pages
    │   │   ├── contexts/        # AuthContext (JWT state)
    │   │   ├── hooks/           # useAuth, useApi, useToast
    │   │   └── types/           # Shared TypeScript types
    │   └── vite.config.ts
    ├── docker-compose.yml
    └── README.md                # Detailed technical documentation
```

---

## 🔮 Future Roadmap

- [ ] 📡 Real-time notifications via WebSocket
- [ ] 📱 Mobile app (React Native)
- [ ] 🇧🇩 Bengali language UI
- [ ] 🤖 AI-powered crop disease detection
- [ ] 🌦️ Bangladesh Meteorological Department API integration
- [ ] 📶 Offline-first PWA for rural connectivity
- [ ] 📲 SMS gateway (Bangladeshi providers)

---

## 📜 License

Academic project — SWE-382, Metropolitan University.

---

<div align="center">

**Developed with ❤️ for rural Bangladesh**

*PolliBondhu — পল্লীবন্ধু*

</div>
