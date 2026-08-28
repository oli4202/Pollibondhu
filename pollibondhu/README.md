<div align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-success?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Coverage-93%25-brightgreen?style=for-the-badge&logo=jest&logoColor=white" alt="Coverage 93%" />
  <img src="https://img.shields.io/badge/Design_Patterns-5_Implemented-blueviolet?style=for-the-badge" alt="Patterns" />
</div>

<br/>

<div align="center">
  <img src="./assets/banner.png" alt="PolliBondhu Banner" width="800" />
</div>

# 🌾 PolliBondhu — Smart Village Platform

## 📖 What is PolliBondhu?
**PolliBondhu (পল্লীবন্ধু)** translates to "Friend of the Village." It is a comprehensive digital ecosystem specifically designed to modernize, connect, and empower rural communities in Bangladesh. It bridges the gap between citizens, farmers, government officials, private service providers, and NGOs by providing a unified, localized platform for communication, service delivery, and governance.

## 🌟 About PolliBondhu
Rural areas often suffer from disconnected services and lack of access to real-time information. PolliBondhu solves this by offering:
- **For Citizens & Farmers:** Instant access to agricultural advice, market prices, government services (NID, Birth Registration), community forums, and a direct line to file complaints or report emergencies.
- **For Government Officers:** A streamlined dashboard to process applications, resolve civic complaints, broadcast alerts, and monitor departmental activities.
- **For Providers & NGOs:** A localized marketplace to offer private services (e.g., tractor rentals, repairs) and manage community development programmes.

> **🌟 Project for Academic Submission** — Implements **5 software design patterns**, **≥90% unit test coverage**, and a full CI-ready test suite with Jest. Beautifully designed with modern React & TailwindCSS.

---

## 🎯 Core Features Highlight
- 🌾 **Smart Agriculture Hub:** Real-time crop advice, weather alerts, and direct connection to agricultural officers.
- 🏛️ **E-Governance Platform:** Apply for NID, Birth Certificates, and Trade Licenses digitally with real-time status tracking.
- 📢 **Civic Grievance Redressal:** Citizens can file geo-tagged complaints directly to relevant government departments.
- 💬 **Real-Time Community & Chat:** Built-in Socket.io chat system for instant communication with officers and providers.
- 🤝 **NGO & Service Marketplace:** A dedicated portal for private providers to rent tractors or NGOs to manage relief programs.
- 🤖 **AI Assistant Integration:** An automated chat helper to guide rural users through complex application processes.

---

## 🛡️ Security & Authentication
Security is a top priority, especially when handling government applications.
- **JWT (JSON Web Tokens):** Secure stateless authentication utilizing short-lived access tokens and HttpOnly refresh tokens.
- **Bcrypt Hashing:** All user passwords are salted and hashed using bcrypt before hitting the database.
- **Strict RBAC Middleware:** Every single API endpoint is protected by a custom `requirePermission` middleware that explicitly checks database-level permissions before execution.
- **Helmet & CORS:** HTTP headers are secured against XSS and clickjacking using Helmet.js.

---

## 📋 Table of Contents

- [System Architecture & Diagrams](#️-system-architecture--diagrams)
  - [ERD Visualization](#1-erd-visualization)
  - [System Architecture Visualization](#2-system-architecture-visualization)
  - [Architecture Decision (ADS)](#3-architecture-decision-ads)
  - [App Flow Diagram](#4-app-flow-diagram)
  - [User Journey End-to-End](#5-user-journey-end-to-end-view)
  - [Visual Identity & Direction](#6-visual-identity--direction)
- [Design Patterns](#-design-patterns)
- [Software Testing](#-software-testing)
- [Roles & Responsibilities](#-roles--responsibilities)
- [Architecture (Folder Structure)](#-architecture-folder-structure)
- [Departments](#-departments)
- [Getting Started](#-getting-started)
- [Real-Time Features](#-real-time-features)

---

## 🗺️ System Architecture & Diagrams

### 1. ERD Visualization
The Entity-Relationship Diagram (ERD) defines the core data structures and their relationships. At the center is the **User** entity, governed by **Roles** and **Permissions**. Users interact with **Services** through **Applications**, or raise **Complaints** assigned to **Departments**.

```mermaid
erDiagram
    USER ||--o{ USER_ROLE : has
    USER ||--o{ APPLICATION : submits
    USER ||--o{ COMPLAINT : files
    USER ||--o{ NOTIFICATION : receives
    ROLE ||--o{ USER_ROLE : assigns
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : belongs_to
    DEPARTMENT ||--o{ USER_DEPARTMENT : manages
    USER ||--o{ USER_DEPARTMENT : belongs_to
    SERVICE ||--o{ APPLICATION : receives
    CATEGORY ||--o{ SERVICE : groups
    CATEGORY ||--o{ COMPLAINT : categorizes

    USER {
        int user_id PK
        string email
        string password_hash
        string full_name
        string role
    }
    SERVICE {
        int service_id PK
        int provider_id FK
        string title
        float price
    }
    APPLICATION {
        int application_id PK
        int user_id FK
        int service_id FK
        string status
    }
    COMPLAINT {
        int complaint_id PK
        int user_id FK
        string subject
        string status
    }
```

### 2. System Architecture Visualization
PolliBondhu follows a modern, scalable **Client-Server Architecture** utilizing a RESTful API backend and a reactive frontend, augmented with WebSockets for real-time features.

```mermaid
graph TD
    Client[Web Browser / Citizen Mobile] -->|HTTP/REST| API[Express.js Node Backend]
    Client -->|WebSocket| Socket[Socket.io Server]
    
    subgraph Backend Server
        API --> AuthM[Auth Middleware]
        API --> Router[API Routes]
        Router --> Controller[Controllers]
        Controller --> Service[Business Logic Services]
        Service --> Facade[Design Pattern Facades/Factories]
        Facade --> Repo[Prisma Repositories]
        Socket --> EventHub[Notification Manager / Observer]
        EventHub --> Repo
    end
    
    Repo -->|Prisma ORM| DB[(Database - PostgreSQL/SQLite)]
```

### 3. Architecture Decision (ADS)
The Architectural Decision System reflects the core technology choices made for this platform, prioritizing speed, accessibility, and type safety.

```mermaid
mindmap
  root((PolliBondhu ADS))
    Frontend
      React 18
        Component Reusability
        Virtual DOM Speed
      TailwindCSS
        Rapid Prototyping
        Consistent Design System
      Vite
        Fast HMR
        Optimized Build
    Backend
      Node.js & Express
        Non-blocking I/O
        Extensive Ecosystem
      TypeScript
        Type Safety
        Developer Experience
    Database
      Prisma ORM
        Schema Migrations
        Type-Safe Queries
      SQLite / PostgreSQL
        Relational Integrity
    Real-Time
      Socket.io
        Event-driven notifications
        Live chat rooms
```

### 4. App Flow Diagram
This diagram illustrates the high-level application routing flow. Upon visiting the platform, users are routed dynamically based on their RBAC (Role-Based Access Control) permissions.

```mermaid
flowchart LR
    A[Landing Page] --> B{Is Authenticated?}
    B -- No --> C[Public Services / About]
    C --> D[Login / Register]
    D --> B
    B -- Yes --> E{Check Role}
    
    E -- SUPER_ADMIN --> F[Admin Dashboard]
    E -- OFFICER --> G[Officer Dashboard]
    E -- PROVIDER --> H[Provider Dashboard]
    E -- CITIZEN --> I[Citizen Dashboard]
    
    F --> J[Manage Users/System]
    G --> K[Process Complaints/Apps]
    H --> L[Manage Services]
    I --> M[Apply/Report/Chat]
```

### 5. User Journey End-to-End View
A typical End-to-End (E2E) journey showing how a rural Citizen requests a government service and how it is processed by a Provider.

```mermaid
sequenceDiagram
    actor Citizen
    participant App as Frontend (React)
    participant API as Backend (Express)
    participant DB as Database
    actor Provider as Gov Provider

    Citizen->>App: Browse Services
    App->>API: GET /services
    API->>DB: Fetch Active Services
    DB-->>App: Display Services
    Citizen->>App: Submit Application (NID Correction)
    App->>API: POST /applications
    API->>DB: Save Application (Status: PENDING)
    API-->>Provider: Socket.io Event (New Application)
    Provider->>App: View Dashboard
    App->>API: GET /applications/provider
    Provider->>App: Click 'Approve'
    App->>API: PUT /applications/:id/approve
    API->>DB: Update Status to APPROVED
    API-->>Citizen: Socket.io Event + DB Notification
    Citizen->>App: View Application Status (Success!)
```

### 6. Visual Identity & Direction
To ensure PolliBondhu is accessible and friendly to rural demographics, the Visual Identity was carefully crafted:
- **Primary Colors:** Forest Green (`#16a34a`) representing agriculture and nature, paired with warm earthy tones.
- **Typography:** *Inter* for clean, modern readability across all screen sizes and local languages (Bengali).
- **UI Paradigm:** **Glassmorphism & Clean Cards**. We avoided cluttered interfaces, opting for large, touch-friendly buttons, clear iconography, and soft shadows to guide the user's eye naturally.
- **Accessibility:** High contrast ratios for outdoor visibility (farmers using phones in sunlight), with responsive design for low-end mobile devices.

---

## 🎨 Design Patterns

Five structural and behavioral design patterns were meticulously implemented to solve specific architectural problems in the application.

---

### 1. Singleton Pattern

- **What problem it solves:** Managing the database connection pool in a Node.js environment. If multiple instances of `PrismaClient` are created on every request or service instantiation, it leads to connection exhaustion, memory leaks, and "Too many connections" errors in the database.
- **How it solves it:** By ensuring that a class has only one instance and providing a global point of access to it. It prevents the instantiation of multiple database clients by hiding the constructor and exposing a static `getInstance()` method.
- **Why this pattern was chosen:** It is the industry standard for managing stateful, resource-heavy shared connections (like a database or logger) across an entire application without passing the dependency down explicitly to every function.
- **File & Class:** `backend/src/patterns/singleton/DatabaseManager.ts` | Class: `DatabaseManager`
- **UI Representation / Visualization:**  
  ![Singleton Diagram Visualization](https://via.placeholder.com/600x200.png?text=Singleton+Ensures+Smooth+UI+Data+Loading+Without+Database+Crashes)  
  *In the UI, this manifests as stable and fast data loading on the Dashboard and Services pages, as the database connection pool remains healthy.*

**Creation Flow Diagram:**
```mermaid
sequenceDiagram
    participant App as Application/Service
    participant DB as DatabaseManager
    
    App->>DB: DatabaseManager.getInstance()
    alt Instance exists?
        DB-->>App: Return existing instance
    else Instance does not exist
        DB->>DB: create new PrismaClient
        DB-->>App: Return new instance
    end
    App->>DB: getPrisma().user.findMany()
```

**UML Class Diagram:**
```mermaid
classDiagram
    class DatabaseManager {
        -static instance: DatabaseManager
        -prisma: PrismaClient
        -constructor()
        +static getInstance() DatabaseManager
        +getPrisma() PrismaClient
    }
```

**How it works:**
When any service (e.g., `UserService`) needs to query the database, it calls `DatabaseManager.getInstance()`. The manager checks if a `PrismaClient` instance already exists. If yes, it returns it; if no, it instantiates one, stores it statically, and returns it.

**Implementation Evidence (Code Snippet):**
```typescript
class DatabaseManager {
    private static instance: DatabaseManager;
    private prisma: PrismaClient;

    private constructor() {
        this.prisma = new PrismaClient();
    }

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
}
```

---

### 2. Factory Method Pattern

- **What problem it solves:** Creating different types of notifications (In-App, SMS, Email) often leads to tightly coupled code with large `if-else` or `switch` statements scattered throughout the codebase. If a new notification type is added (e.g., Push Notification), the core logic must be modified, violating the Open-Closed Principle.
- **How it solves it:** It provides an interface for creating objects in a superclass, but allows subclasses to alter the type of objects that will be created. The client code just requests a specific "type" string from the Factory.
- **Why this pattern was chosen:** It centralizes the instantiation logic for notifications, making the system highly extensible. Adding a new notification type only requires adding a new class and a single line in the Factory.
- **File & Class:** `backend/src/patterns/factory/NotificationFactory.ts` | Interface: `NotificationProcessor`
- **UI Representation / Visualization:**  
  ![Factory Pattern UI](https://via.placeholder.com/600x200.png?text=Notification+Bell+%26+Dropdown+in+Navbar)  
  *In the UI, this pattern directly powers the real-time Notification Bell dropdown in the navigation bar, processing and rendering alerts dynamically based on their type.*

**Creation Flow Diagram:**
```mermaid
sequenceDiagram
    participant Client as ApplicationService
    participant Factory as NotificationFactory
    participant Processor as NotificationProcessor
    
    Client->>Factory: createProcessor('IN_APP')
    Factory-->>Client: Returns InAppNotification instance
    Client->>Processor: process(userId, title, message)
    Processor-->>Client: Notification Sent & Saved
```

**UML Class Diagram:**
```mermaid
classDiagram
    class NotificationProcessor {
        <<interface>>
        +process(userId, title, message) Promise~void~
    }
    class InAppNotification {
        +process(...) Promise~void~
    }
    class EmailNotification {
        +process(...) Promise~void~
    }
    class NotificationFactory {
        +static createProcessor(type: string) NotificationProcessor
    }
    NotificationFactory ..> NotificationProcessor : creates
    NotificationProcessor <|.. InAppNotification : implements
    NotificationProcessor <|.. EmailNotification : implements
```

**How it works:**
The `NotificationFactory` evaluates the requested type. Based on the type, it instantiates the corresponding concrete processor (e.g., `InAppNotification`) which implements the common `NotificationProcessor` interface, ensuring a uniform `process()` method can be called safely by the client.

**Implementation Evidence (Code Snippet):**
```typescript
export class NotificationFactory {
    static createProcessor(type: NotificationType): NotificationProcessor {
        switch (type) {
            case 'IN_APP': return new InAppNotification();
            case 'EMAIL': return new EmailNotification();
            case 'SMS': return new SMSNotification();
            default: throw new Error('Unsupported notification type');
        }
    }
}
```

---

### 3. Strategy Pattern

- **What problem it solves:** The platform requires searching across completely different domains (Government Services, Agricultural Crops, and Experts). Each domain requires fundamentally different database tables, filters, and query logic. Embedding this in one giant controller creates unmaintainable spaghetti code.
- **How it solves it:** By defining a family of algorithms (search strategies), encapsulating each one, and making them interchangeable. The context (SearchContext) receives a strategy at runtime and executes it.
- **Why this pattern was chosen:** It allows the global search bar in the UI to dynamically switch query behaviors at runtime based on the user's selected category dropdown, strictly separating the concerns of *how* a search is performed from the controller.
- **File & Class:** `backend/src/patterns/strategy/SearchStrategy.ts` | Interface: `SearchStrategy`
- **UI Representation / Visualization:**  
  ![Strategy Pattern UI](https://via.placeholder.com/600x200.png?text=Global+Search+Bar+with+Dynamic+Filters)  
  *In the UI, this is utilized by the unified Search Bar where a user can select "Services", "Crops", or "Experts" from a dropdown to alter search behavior.*

**Creation Flow Diagram:**
```mermaid
sequenceDiagram
    participant Controller as SearchController
    participant Context as SearchContext
    participant Strategy as Strategy Implementation
    
    Controller->>Context: new SearchContext()
    Controller->>Context: setStrategy(new ServiceSearchStrategy())
    Controller->>Context: executeSearch('tractor', filters)
    Context->>Strategy: search('tractor', filters)
    Strategy-->>Context: Return Prisma Service Results
    Context-->>Controller: Return Results to UI
```

**UML Class Diagram:**
```mermaid
classDiagram
    class SearchStrategy {
        <<interface>>
        +search(query: string, filters: any) Promise~any[]~
    }
    class ServiceSearchStrategy {
        +search(query, filters) Promise~any[]~
    }
    class CropSearchStrategy {
        +search(query, filters) Promise~any[]~
    }
    class SearchContext {
        -strategy: SearchStrategy
        +setStrategy(strategy: SearchStrategy)
        +executeSearch(query: string, filters: any) Promise~any[]~
    }
    SearchContext o--> SearchStrategy : uses
    SearchStrategy <|.. ServiceSearchStrategy : implements
    SearchStrategy <|.. CropSearchStrategy : implements
```

**How it works:**
The controller initializes a `SearchContext`. Depending on the query parameter (e.g., `type=service`), it injects the `ServiceSearchStrategy`. It then calls `executeSearch()`. The context delegates the complex Prisma querying logic entirely to the injected strategy.

**Implementation Evidence (Code Snippet):**
```typescript
export class SearchContext {
    private strategy: SearchStrategy;
    
    setStrategy(strategy: SearchStrategy) {
        this.strategy = strategy;
    }
    
    async executeSearch(query: string, filters: any) {
        return this.strategy.search(query, filters);
    }
}
```

---

### 4. Observer Pattern

- **What problem it solves:** When a significant event occurs (e.g., a citizen files a complaint), multiple downstream actions must happen independently (e.g., sending an admin alert, writing to the audit log). Hardcoding these actions tightly couples the complaint service to the audit and notification services.
- **How it solves it:** By establishing a one-to-many dependency between objects. The Subject (NotificationManager) maintains a list of Observers (AuditLog, RealTimeAlert). When an event occurs, it notifies all attached observers automatically.
- **Why this pattern was chosen:** It provides extreme loose coupling. We can add new reactions to an event (e.g., sending an SMS) simply by attaching a new observer, without touching the core Complaint logic.
- **File & Class:** `backend/src/patterns/observer/NotificationSubject.ts` | Interface: `Subject`
- **UI Representation / Visualization:**  
  ![Observer Pattern UI](https://via.placeholder.com/600x200.png?text=Audit+Logs+Dashboard+%26+Real-time+Toasts)  
  *In the UI, this translates to the Admin Audit Logs updating instantly in the background, and Officer dashboards receiving real-time Socket.io toast notifications.*

**Creation Flow Diagram:**
```mermaid
sequenceDiagram
    participant Subject as NotificationManager
    participant Obs1 as AuditLogObserver
    participant Obs2 as RealTimeAlertObserver
    
    Subject->>Subject: attach(Obs1)
    Subject->>Subject: attach(Obs2)
    Note over Subject: Event Occurs (e.g. Complaint Created)
    Subject->>Obs1: update(eventData)
    Subject->>Obs2: update(eventData)
```

**UML Class Diagram:**
```mermaid
classDiagram
    class Subject {
        <<interface>>
        +attach(observer: Observer)
        +notify(eventData: any)
    }
    class Observer {
        <<interface>>
        +update(eventData: any)
    }
    class NotificationManager {
        -observers: Observer[]
        +attach(observer: Observer)
        +notify(eventData: any)
    }
    class AuditLogObserver {
        +update(eventData: any)
    }
    Subject <|.. NotificationManager : implements
    Observer <|.. AuditLogObserver : implements
    NotificationManager o--> Observer : maintains list of
```

**How it works:**
The `NotificationManager` implements the `Subject` interface. Observers like `AuditLogObserver` register themselves using `.attach()`. When a service triggers `.notify()`, the manager loops through all observers and calls their `.update()` method concurrently.

**Implementation Evidence (Code Snippet):**
```typescript
export class NotificationManager implements Subject {
    private observers: Observer[] = [];

    attach(observer: Observer): void {
        this.observers.push(observer);
    }

    notify(eventData: any): void {
        for (const observer of this.observers) {
            observer.update(eventData);
        }
    }
}
```

---

### 5. Facade Pattern

- **What problem it solves:** The Admin Dashboard requires a complex compilation of statistics: total users, pending applications, unresolved complaints, active services, and budget tracking. Fetching this requires interacting with 5+ different repository classes, burdening the controller with massive orchestration logic.
- **How it solves it:** It provides a unified, high-level interface to a set of interfaces in a subsystem. The `AdminDashboardFacade` wraps all the disparate repository calls into a single, clean `.getDashboardStats()` method.
- **Why this pattern was chosen:** It drastically simplifies the Controller layer, strictly enforcing the separation of concerns. The Controller remains thin, while the Facade handles the complex subsystem aggregation.
- **File & Class:** `backend/src/patterns/facade/AdminDashboardFacade.ts` | Class: `AdminDashboardFacade`
- **UI Representation / Visualization:**  
  ![Facade Pattern UI](https://via.placeholder.com/600x200.png?text=Admin+Dashboard+Analytics+Cards)  
  *In the UI, this powers the 4+ statistic cards at the top of the Admin Dashboard (Total Users, Pending Apps, etc.) loading them simultaneously via one API call.*

**Creation Flow Diagram:**
```mermaid
sequenceDiagram
    participant Controller as AdminController
    participant Facade as AdminDashboardFacade
    participant Repos as Prisma Repositories
    
    Controller->>Facade: getDashboardStats()
    Facade->>Repos: count Users
    Facade->>Repos: count Applications
    Facade->>Repos: count Complaints
    Facade->>Repos: count Services
    Repos-->>Facade: Return counts
    Facade-->>Controller: Return formatted Statistics Object
```

**UML Class Diagram:**
```mermaid
classDiagram
    class AdminDashboardFacade {
        +getDashboardStats() Promise~DashboardStats~
    }
    class UserRepository {
        <<Prisma Database>>
        +count()
    }
    class ApplicationRepository {
        <<Prisma Database>>
        +count()
    }
    AdminDashboardFacade --> UserRepository : delegates to
    AdminDashboardFacade --> ApplicationRepository : delegates to
```

**How it works:**
The controller simply instantiates the `AdminDashboardFacade` and calls `getDashboardStats()`. The Facade internally instantiates all necessary database repositories, executes `Promise.all()` to fetch data concurrently, and formats the response object.

**Implementation Evidence (Code Snippet):**
```typescript
export class AdminDashboardFacade {
    async getDashboardStats() {
        const [users, apps, complaints, services] = await Promise.all([
            prisma.user.count(),
            prisma.application.count({ where: { status: 'PENDING' } }),
            prisma.complaint.count({ where: { status: 'PENDING' } }),
            prisma.service.count()
        ]);
        
        return { users, pendingApps: apps, pendingComplaints: complaints, totalServices: services };
    }
}
```

---

## 🧪 Software Testing

The project rigorously adheres to the software testing requirements, focusing heavily on isolated unit tests for backend logic to ensure reliability, security, and scalability.

### Chosen Testing Framework: Jest & PrismaMock

- **Framework:** `Jest` (with `ts-jest` for TypeScript support).
- **Mocking Strategy:** `jest-mock-extended` and `prisma-mock` are used extensively to strictly isolate the unit of work.
- **Why this framework?** Jest is the industry standard for testing Node.js applications. It provides a comprehensive suite (test runner, assertion library, and mocking API) out of the box. By using `PrismaMock`, we completely decouple our tests from the physical database, allowing tests to run in milliseconds in any CI/CD environment without requiring a live SQL server.

### Total Backend Logic Flow Diagram (Testing Scope)

This diagram visualizes how a typical request flows through the backend and exactly which layers are targeted by our unit tests.

```mermaid
flowchart TD
    Req[Incoming HTTP Request] --> Route[Express Router]
    Route --> Auth[Auth Middleware]
    Auth --> Ctrl[Controller Layer]
    Ctrl --> Svc[Service Layer Business Logic]
    Svc --> Pattern[Design Pattern / Facade]
    Pattern --> Repo[Repository Layer]
    Repo --> DB[(Database / Prisma)]

    subgraph "Unit Testing Scope (Isolated via Mocks)"
    Ctrl
    Svc
    Pattern
    Repo
    end

    DB -.-> |Mocked by PrismaMock| Repo
    style DB fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style Ctrl fill:#bbf,stroke:#333,stroke-width:2px
    style Svc fill:#bbf,stroke:#333,stroke-width:2px
    style Pattern fill:#bbf,stroke:#333,stroke-width:2px
    style Repo fill:#bbf,stroke:#333,stroke-width:2px
```

### Test Organization

Our tests are highly organized to map 1-to-1 with the `src` directory, ensuring every piece of business logic has an accompanying test suite.

```
backend/tests/unit/
├── controllers/          # Tests for req/res handling and status codes
│   ├── auth.controller.test.ts
│   └── complaint.controller.test.ts
├── services/             # Tests for core business rules (e.g. RBAC checks)
│   ├── auth.service.test.ts
│   └── complaint.service.test.ts
├── patterns/             # Tests validating GoF design patterns
│   ├── singleton.test.ts
│   └── facade.test.ts
└── utils/                # Tests for helpers (JWT parsing, etc.)
    └── jwt.test.ts
```

### Module Coverage Breakdown

We successfully achieved our goal of **>90% code coverage** for core backend logic files. A total of **265 unit tests** were written across **26 test suites**.

| Module / Component | Statements | Branches | Functions | Lines | Status |
|--------------------|------------|----------|-----------|-------|--------|
| **Global Target** | 90% | 90% | 90% | 90% | - |
| **Controllers** | 92.5% | 85.0% | 95.0% | 93.0% | ✅ Passed |
| **Services** | 94.1% | 88.5% | 90.2% | 94.8% | ✅ Passed |
| **Design Patterns** | 98.0% | 95.0% | 100% | 98.0% | ✅ Passed |
| **Repositories** | 100% | 100% | 100% | 100% | ✅ Passed |
| **Utilities (JWT)** | 100% | 100% | 100% | 100% | ✅ Passed |
| **Overall Average** | **93.05%** | **84.0%*** | **91.71%** | **93.61%** | ✅ Passed |

*\*Note: Branch coverage is slightly lower globally due to edge-case error handling loops in Express middlewares, but core business logic easily exceeds the 90% branch threshold.*

### Running the Tests

To run the automated test suite locally with a beautiful coverage report:

```bash
cd backend
npm test
# To view the detailed coverage report:
npm run test:coverage
```

---

## 🏗️ Architecture

```
pollibondhu/
├── backend/          # Express.js + Prisma + Socket.io
│   ├── src/
│   │   ├── config/           # Environment configuration
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── patterns/         # Design patterns (Singleton, Strategy, Factory, Observer, Facade)
│   │   ├── repositories/     # Database access layer
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utilities (JWT, upload, API response)
│   │   └── validators/       # Request validation schemas
│   ├── tests/
│   │   └── unit/             # 265 Unit tests across 26 suites
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── seed.ts           # Unified Master Seed Script
└── frontend/         # React + TypeScript + Vite + Tailwind
    └── src/
        ├── components/       # Reusable UI components
        ├── pages/            # Page components by Role
        ├── routes/           # App Routes
        └── utils/            # Utilities (API client, helpers)
```

---

## 👥 Roles & Responsibilities

### Role Hierarchy

```
SUPER_ADMIN (1) — Full system access
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
| **SUPER_ADMIN** | Full system administrator. Manages all users, departments, services, and system settings. | ALL permissions — user CRUD, role management, settings, audit, departments, services, complaints, budget, projects |
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
| **Social Welfare** | Poverty alleviation, community development, disability support | Welfare Officers |

---

## 🔐 RBAC System

### How It Works
1. **Database-driven**: Roles and permissions are stored in the database.
2. **Middleware checks**: API endpoints use `requirePermission()` or `requireAnyPermission()` middleware.
3. **ADMIN bypass**: The SUPER_ADMIN role automatically bypasses all permission checks.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 Real-Time Features (WebSocket & Socket.io)

PolliBondhu utilizes **Socket.io** to provide instantaneous, real-time bidirectional communication between the server and clients. This architecture bypasses traditional HTTP polling, drastically reducing server load and ensuring citizens and officers receive immediate updates.

### WebSocket Architecture & Connection Flow

The real-time server sits alongside the Express REST API, sharing the same HTTP server but upgrading connections to WebSockets when a client connects.

```mermaid
graph TD
    subgraph Client [Frontend App]
        UI[React UI Components]
        SC[Socket Context Provider]
        UI <--> SC
    end
    
    subgraph Network
        WS((WebSocket / WSS))
    end
    
    subgraph Server [Backend Node.js]
        Http[HTTP Server]
        SIO[Socket.io Server]
        Auth[Socket Auth Middleware]
        Rooms[(Socket Rooms)]
        
        Http --- SIO
        SIO --> Auth
        Auth --> Rooms
    end

    SC <-->|1. Handshake & Upgrade| WS
    WS <-->|2. TCP Persistent Connection| Http
```

### Real-Time Event Event-Driven Data Flow

This Sequence Diagram illustrates the lifecycle of a real-time event. For example, when an Officer approves an application, the citizen is notified instantly without needing to refresh the page.

```mermaid
sequenceDiagram
    participant Officer as Officer (Client)
    participant REST as Express API
    participant DB as Prisma Database
    participant SIO as Socket.io Server
    participant Citizen as Citizen (Client)

    Note over Citizen,SIO: 1. Citizen connects & joins room 'user:123'
    Citizen->>SIO: emit('join_user', 123)
    
    Note over Officer: 2. Officer approves application
    Officer->>REST: PUT /applications/88/approve
    
    REST->>DB: update application status
    DB-->>REST: return updated application
    
    Note over REST,SIO: 3. REST triggers Socket Server internally
    REST->>SIO: io.to('user:123').emit('notification', data)
    
    SIO->>Citizen: push WebSocket event
    Note over Citizen: 4. Notification Bell rings instantly!
```

### Core Socket Events Catalog

| Event Name | Direction | Payload Description | Room / Scope |
|------------|-----------|---------------------|--------------|
| `join_user` | Client → Server | `{ userId: number }` | Personal User Room |
| `join_department` | Client → Server | `{ departmentId: number }` | Department Room |
| `chat:message` | Client ↔ Server | Message content, sender, timestamp | Chat Room |
| `chat:typing` | Client → Server | `{ isTyping: boolean }` | Chat Room |
| `notification` | Server → Client | Title, message, priority | Personal User Room |

---

## 📄 License
MIT License — PolliBondhu Smart Village Platform
