# Design Patterns (DESIGN_PATTERNS.md)
## PolliBondhu — Software Design Patterns

**Version:** 2.0  
**Date:** August 2026  
**Patterns:** 5 (Singleton, Factory Method, Strategy, Observer, Facade)

---

## 1. Singleton Pattern

### 1.1 Problem
Multiple instances of database connections or loggers cause resource waste, inconsistent state, and debugging difficulties.

### 1.2 Solution
Ensure only one instance exists globally with a controlled access point.

### 1.3 Implementation

**DatabaseManager** — Ensures single PrismaClient instance
```typescript
// backend/src/patterns/singleton/DatabaseManager.ts
export class DatabaseManager {
  private static instance: PrismaClient | null = null;

  private constructor() {} // Prevent external instantiation

  public static getInstance(): PrismaClient {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error'] 
          : ['error'],
      });
    }
    return DatabaseManager.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseManager.instance) {
      await DatabaseManager.instance.$disconnect();
      DatabaseManager.instance = null;
    }
  }
}

export const prisma = DatabaseManager.getInstance();
```

**Logger** — Ensures single Winston logger instance
```typescript
// backend/src/patterns/singleton/Logger.ts
export class Logger {
  private static instance: winston.Logger | null = null;

  private constructor() {}

  public static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        defaultMeta: { service: 'pollibondhu-api' },
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
      });
    }
    return Logger.instance;
  }
}

export const logger = Logger.getInstance();
```

### 1.4 UML Diagram
```
┌─────────────────────────┐
│      <<class>>          │
│      DatabaseManager    │
├─────────────────────────┤
│ - static instance:      │
│   PrismaClient | null   │
├─────────────────────────┤
│ - DatabaseManager()     │ ← private constructor
│ + static getInstance()  │
│ + static disconnect()   │
└─────────────────────────┘
         △
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Database│ │ Logger │
│Manager │ │        │
└────────┘ └────────┘
```

### 1.5 Real PolliBondhu Use Case
Every repository, service, and controller calls `DatabaseManager.getInstance()` to get the shared Prisma client. This prevents creating hundreds of database connections when the server handles concurrent requests.

### 1.6 Test
```typescript
it('DatabaseManager should return same instance', () => {
  const db1 = DatabaseManager.getInstance();
  const db2 = DatabaseManager.getInstance();
  expect(db1).toBe(db2);
});
```

---

## 2. Factory Method Pattern

### 2.1 Problem
The system needs different notification types (in-app, email, system) with different formatting rules. Direct instantiation creates conditional logic scattered across the codebase.

### 2.2 Solution
Centralize object creation in a factory that encapsulates the creation logic and returns the correct subclass.

### 2.3 Implementation

```typescript
// backend/src/patterns/factory/NotificationFactory.ts
export interface NotificationPayload {
  user_id: number;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export abstract class Notification {
  protected payload: NotificationPayload;

  constructor(payload: NotificationPayload) {
    this.payload = payload;
  }

  abstract getType(): string;
  abstract getContent(): { title: string; message: string; metadata?: Record<string, any> };
}

export class InAppNotification extends Notification {
  getType(): string { return 'IN_APP'; }
  getContent() {
    return {
      title: this.payload.title,
      message: this.payload.message,
      metadata: { ...this.payload.metadata, channel: 'in-app' },
    };
  }
}

export class EmailNotification extends Notification {
  getType(): string { return 'EMAIL'; }
  getContent() {
    return {
      title: `[Email] ${this.payload.title}`,
      message: this.payload.message,
      metadata: { ...this.payload.metadata, channel: 'email', template: 'default' },
    };
  }
}

export class SystemAnnouncement extends Notification {
  getType(): string { return 'SYSTEM'; }
  getContent() {
    return {
      title: `[System] ${this.payload.title}`,
      message: this.payload.message,
      metadata: { ...this.payload.metadata, channel: 'system', priority: 'high' },
    };
  }
}

export class NotificationFactory {
  static createNotification(
    type: 'IN_APP' | 'EMAIL' | 'SYSTEM',
    payload: NotificationPayload
  ): Notification {
    switch (type) {
      case 'IN_APP': return new InAppNotification(payload);
      case 'EMAIL': return new EmailNotification(payload);
      case 'SYSTEM': return new SystemAnnouncement(payload);
      default: throw new Error(`Unknown notification type: ${type}`);
    }
  }
}
```

### 2.4 UML Diagram
```
┌─────────────────────────┐
│   NotificationFactory   │
├─────────────────────────┤
│ + createNotification()  │
└───────────┬─────────────┘
            │ creates
            ▼
┌─────────────────────────┐
│   <<abstract>>          │
│   Notification          │
├─────────────────────────┤
│ # payload: NotificationPayload │
├─────────────────────────┤
│ + getType(): string     │
│ + getContent(): object  │
└───────────┬─────────────┘
            △
    ┌───────┼───────┐
    ▼       ▼       ▼
┌────────┐┌──────┐┌─────────┐
│ InApp  ││Email ││ System  │
│ Notif  ││Notif ││Announce │
└────────┘└──────┘└─────────┘
```

### 2.5 Real PolliBondhu Use Case
When admin approves a service, the Observer pattern triggers `NotificationFactory.createNotification('IN_APP', { provider_id, title: 'Service Approved', message: '...' })` to create the correct notification type. Adding SMS or Push notifications later requires only adding new subclasses — no changes to calling code.

### 2.6 Tests
```typescript
it('should create InApp notification', () => {
  const notif = NotificationFactory.createNotification('IN_APP', { user_id: 1, title: 'Test', message: 'Hello' });
  expect(notif.getType()).toBe('IN_APP');
  expect(notif.getContent().title).toBe('Test');
});

it('should throw for unknown type', () => {
  expect(() => NotificationFactory.createNotification('UNKNOWN' as any, { user_id: 1, title: 'X', message: 'Y' }))
    .toThrow('Unknown notification type');
});
```

---

## 3. Strategy Pattern

### 3.1 Problem
Different entities (services, crops, experts) require different search algorithms with different joins, filters, and sorting. One monolithic search function violates the Open/Closed principle.

### 3.2 Solution
Define a common interface for search algorithms. Encapsulate each algorithm in its own strategy class. Use a context to switch between strategies at runtime.

### 3.3 Implementation

```typescript
// backend/src/patterns/strategy/SearchStrategy.ts
export interface SearchCriteria {
  query?: string;
  location?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchStrategy<T> {
  search(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<T>>;
}

export class ServiceSearchStrategy implements SearchStrategy<any> {
  async search(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<any>> {
    // Joins users table for provider location data
    // Filters by status='APPROVED', is_available=true
    // Supports query, location, category filters
    // ...
  }
}

export class CropSearchStrategy implements SearchStrategy<any> {
  async search(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<any>> {
    // Searches crop name and Bengali name
    // Filters by season
    // No provider join needed
    // ...
  }
}

export class ExpertSearchStrategy implements SearchStrategy<any> {
  async search(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<any>> {
    // Filters by is_verified=true
    // Joins user table for district
    // Filters by specialization
    // ...
  }
}

export class SearchContext<T> {
  private strategy: SearchStrategy<T>;

  constructor(strategy: SearchStrategy<T>) {
    this.strategy = strategy;
  }

  setStrategy(strategy: SearchStrategy<T>): void {
    this.strategy = strategy;
  }

  async execute(criteria: SearchCriteria, prisma: PrismaClient): Promise<SearchResult<T>> {
    return this.strategy.search(criteria, prisma);
  }
}
```

### 3.4 UML Diagram
```
┌─────────────────────────┐
│     SearchContext       │
├─────────────────────────┤
│ - strategy: SearchStrategy │
├─────────────────────────┤
│ + setStrategy(s)        │
│ + execute(criteria)     │
└───────────┬─────────────┘
            │ uses
            ▼
┌─────────────────────────┐
│   <<interface>>         │
│   SearchStrategy<T>     │
├─────────────────────────┤
│ + search(criteria):     │
│   SearchResult<T>       │
└───────────┬─────────────┘
            △
    ┌───────┼───────┐
    ▼       ▼       ▼
┌────────┐┌────────┐┌─────────┐
│Service ││ Crop   ││ Expert  │
│Search  ││ Search ││ Search  │
└────────┘└────────┘└─────────┘
```

### 3.5 Real PolliBondhu Use Case
`GET /api/services?query=tractor&location=dinajpur` creates a `SearchContext` with `ServiceSearchStrategy` that joins the `users` table for provider location data. Switching to `CropSearchStrategy` for `GET /api/agriculture/crops?query=rice` uses a completely different query without changing the controller.

### 3.6 Tests
```typescript
it('ServiceSearchStrategy should search services', async () => {
  prismaMock.service.findMany.mockResolvedValue([]);
  prismaMock.service.count.mockResolvedValue(0);

  const strategy = new ServiceSearchStrategy();
  const result = await strategy.search({ query: 'tractor' }, prismaMock as any);

  expect(result.data).toEqual([]);
  expect(prismaMock.service.findMany).toHaveBeenCalled();
});

it('SearchContext should allow strategy switching', async () => {
  prismaMock.crop.findMany.mockResolvedValue([]);
  prismaMock.crop.count.mockResolvedValue(0);

  const context = new SearchContext(new ServiceSearchStrategy());
  context.setStrategy(new CropSearchStrategy());
  const result = await context.execute({ query: 'rice' }, prismaMock as any);

  expect(prismaMock.crop.findMany).toHaveBeenCalled();
});
```

---

## 4. Observer Pattern

### 4.1 Problem
When critical events occur (service approved, complaint resolved), multiple systems need to react (user notifications, audit logs, email). Hardcoding these creates tight coupling.

### 4.2 Solution
Define a subject that maintains a list of observers. When an event occurs, notify all observers. Observers can be added/removed without modifying the subject.

### 4.3 Implementation

```typescript
// backend/src/patterns/observer/NotificationSubject.ts
export interface AppEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
}

export interface EventObserver {
  update(event: AppEvent, prisma: PrismaClient): Promise<void>;
}

export class NotificationSubject {
  private observers: EventObserver[] = [];

  attach(observer: EventObserver): void {
    this.observers.push(observer);
  }

  detach(observer: EventObserver): void {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  async notify(event: AppEvent, prisma: PrismaClient): Promise<void> {
    await Promise.all(this.observers.map((o) => o.update(event, prisma)));
  }
}

// Observer 1: Creates user notifications
export class UserNotificationObserver implements EventObserver {
  async update(event: AppEvent, prisma: PrismaClient): Promise<void> {
    if (event.type === 'SERVICE_APPROVED') {
      const { provider_id, service_title } = event.payload;
      await prisma.notification.create({
        data: {
          user_id: provider_id,
          type: 'IN_APP',
          title: 'Service Approved',
          message: `Your service "${service_title}" has been approved.`,
        },
      });
    }
    // Handle COMPLAINT_RESOLVED, APPLICATION_APPROVED, etc.
  }
}

// Observer 2: Creates audit logs
export class AuditLogObserver implements EventObserver {
  async update(event: AppEvent, prisma: PrismaClient): Promise<void> {
    if (event.payload.admin_id) {
      await prisma.auditLog.create({
        data: {
          admin_id: event.payload.admin_id,
          action: event.type,
          entity_type: event.payload.entity_type || 'UNKNOWN',
          entity_id: event.payload.entity_id,
          details: event.payload,
        },
      });
    }
  }
}

// Wire up observers
export const appEventSubject = new NotificationSubject();
appEventSubject.attach(new UserNotificationObserver());
appEventSubject.attach(new AuditLogObserver());
```

### 4.4 UML Diagram
```
┌─────────────────────────┐
│  NotificationSubject    │
├─────────────────────────┤
│ - observers: Observer[] │
├─────────────────────────┤
│ + attach(observer)      │
│ + detach(observer)      │
│ + notify(event)         │
└───────────┬─────────────┘
            │ notifies
            ▼
┌─────────────────────────┐
│   <<interface>>         │
│   EventObserver         │
├─────────────────────────┤
│ + update(event, prisma) │
└───────────┬─────────────┘
            △
    ┌───────┴────────┐
    ▼                ▼
┌──────────────┐ ┌──────────────┐
│UserNotification│ │ AuditLog    │
│  Observer     │ │ Observer    │
└──────────────┘ └──────────────┘
```

### 4.5 Real PolliBondhu Use Case
When admin approves a service: `appEventSubject.notify({ type: 'SERVICE_APPROVED', payload: { provider_id, service_title, admin_id }, timestamp: new Date() }, prisma)`. This triggers both `UserNotificationObserver` (creates notification for provider) and `AuditLogObserver` (records admin action). Adding a new `EmailNotificationObserver` later requires only creating the class and attaching it — no changes to the service approval code.

### 4.6 Tests
```typescript
it('should notify all observers', async () => {
  const subject = new NotificationSubject();
  const observer1 = { update: jest.fn() };
  const observer2 = { update: jest.fn() };

  subject.attach(observer1);
  subject.attach(observer2);

  await subject.notify({ type: 'TEST', payload: {}, timestamp: new Date() }, prismaMock as any);

  expect(observer1.update).toHaveBeenCalled();
  expect(observer2.update).toHaveBeenCalled();
});

it('AuditLogObserver should create audit log when admin_id present', async () => {
  const observer = new AuditLogObserver();
  prismaMock.auditLog.create.mockResolvedValue({} as any);

  await observer.update(
    { type: 'TEST', payload: { admin_id: 1, entity_type: 'USER', entity_id: 1 }, timestamp: new Date() },
    prismaMock as any
  );

  expect(prismaMock.auditLog.create).toHaveBeenCalled();
});
```

---

## 5. Facade Pattern

### 5.1 Problem
The admin dashboard needs aggregated data from 6+ tables (users, services, complaints, projects, applications, audit logs). Calling each repository individually creates messy, tightly-coupled controllers.

### 5.2 Solution
Provide a simplified interface (facade) that orchestrates multiple subsystems and returns a unified result.

### 5.3 Implementation

```typescript
// backend/src/patterns/facade/AdminDashboardFacade.ts
export class AdminDashboardFacade {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      activeUsers,
      totalProviders,
      totalServices,
      pendingServices,
      pendingComplaints,
      recentActivities,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { is_active: true } }),
      this.prisma.user.count({ where: { role: 'SERVICE_PROVIDER' } }),
      this.prisma.service.count(),
      this.prisma.service.count({ where: { status: 'PENDING' } }),
      this.prisma.complaint.count({ where: { status: { in: ['SUBMITTED', 'REVIEWING'] } } }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { admin: { select: { full_name: true } } },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalProviders,
      totalServices,
      pendingServices,
      pendingComplaints,
      recentActivities,
    };
  }

  async getWeeklyStats(): Promise<WeeklyStats> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [newUsers, newServices, resolvedComplaints, newApplications] = await Promise.all([
      this.prisma.user.count({ where: { created_at: { gte: weekAgo } } }),
      this.prisma.service.count({ where: { created_at: { gte: weekAgo } } }),
      this.prisma.complaint.count({ where: { status: 'RESOLVED', resolved_at: { gte: weekAgo } } }),
      this.prisma.application.count({ where: { created_at: { gte: weekAgo } } }),
    ]);

    return { newUsers, newServices, resolvedComplaints, newApplications };
  }
}
```

### 5.4 UML Diagram
```
┌─────────────────────────┐
│  AdminDashboardFacade   │
├─────────────────────────┤
│ - prisma: PrismaClient  │
├─────────────────────────┤
│ + getDashboardStats()   │
│ + getWeeklyStats()      │
│ + getGrowthMetrics()    │
└───────────┬─────────────┘
            │ orchestrates
    ┌───────┼───────┬───────┐
    ▼       ▼       ▼       ▼
┌──────┐┌──────┐┌────────┐┌──────┐
│ User ││Servic││Complaint││Audit │
│ Count││Count ││ Count  ││ Logs │
└──────┘└──────┘└────────┘└──────┘
```

### 5.5 Real PolliBondhu Use Case
`GET /api/admin/dashboard` calls `facade.getDashboardStats()` which runs 7 parallel Prisma queries and aggregates them into one response. The controller stays thin — just calling the facade and sending the response. Adding a new metric (e.g., `pendingApplications`) only requires modifying the facade, not the controller.

### 5.6 Tests
```typescript
it('should aggregate dashboard stats from multiple tables', async () => {
  prismaMock.user.count.mockResolvedValue(100);
  prismaMock.service.count.mockResolvedValue(50);
  prismaMock.complaint.count.mockResolvedValue(10);
  prismaMock.auditLog.findMany.mockResolvedValue([]);

  const facade = new AdminDashboardFacade(prismaMock as any);
  const stats = await facade.getDashboardStats();

  expect(stats.totalUsers).toBe(100);
  expect(stats.totalServices).toBe(50);
  expect(stats.pendingComplaints).toBe(10);
});
```

---

## 6. Pattern Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    PATTERNS INTERACTION                   │
│                                                         │
│  Singleton (DatabaseManager)                            │
│    └── Provides Prisma to all layers                    │
│                                                         │
│  Facade (AdminDashboardFacade)                          │
│    └── Uses Singleton for database access               │
│    └── Aggregates data from multiple repositories       │
│                                                         │
│  Observer (NotificationSubject)                         │
│    └── Uses Singleton for database access               │
│    └── Uses Factory for notification creation           │
│    └── Triggered by Services (approval, resolution)     │
│                                                         │
│  Factory (NotificationFactory)                          │
│    └── Creates notification objects                     │
│    └── Used by Observer pattern                         │
│    └── Easy to extend with new types (SMS, Push)        │
│                                                         │
│  Strategy (SearchContext)                               │
│    └── Uses Singleton for database access               │
│    └── Used by Controllers for search endpoints         │
│    └── Swappable at runtime based on entity type        │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Future Pattern Extensions

| Pattern | Current | Future Extension |
|---------|---------|-----------------|
| Singleton | DatabaseManager, Logger | ConfigManager, CacheManager |
| Factory | NotificationFactory (3 types) | Add SMS, Push, WhatsApp types |
| Strategy | 3 search strategies | Add ComplaintSearch, ApplicationSearch |
| Observer | 2 observers (Notification, Audit) | Add EmailObserver, SMSObserver, AnalyticsObserver |
| Facade | AdminDashboardFacade | Add CitizenDashboardFacade, OfficerDashboardFacade |
| Adapter | — | External API adapter (weather, market data) |
| Command | — | Undo/redo for admin operations |
| Decorator | — | Rate limiting decorator, caching decorator |
