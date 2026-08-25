# Testing Strategy (TESTING_STRATEGY.md)
## PolliBondhu — Comprehensive Testing Plan

**Version:** 2.0  
**Date:** August 2026  
**Framework:** Jest + Supertest  
**Target Coverage:** 70%+ line and branch  

---

## 1. Testing Philosophy

- **No fake coverage**: Every tested line must have meaningful assertions
- **Test behavior, not implementation**: Focus on inputs/outputs, not internal calls
- **Mock external dependencies**: Database, AI APIs, email/SMS services
- **Test RBAC boundaries**: Every permission boundary must be tested
- **Test edge cases**: Invalid inputs, missing data, concurrent operations

---

## 2. Test Categories

### 2.1 Unit Tests
- **Location:** `tests/unit/`
- **Scope:** Individual services, utilities, patterns
- **Dependencies:** Mocked (Prisma, bcrypt, JWT, external APIs)
- **Speed:** Fast (<1s per test)

### 2.2 Integration Tests
- **Location:** `tests/integration/`
- **Scope:** Full HTTP request/response cycles
- **Dependencies:** Mocked database, real Express app
- **Speed:** Medium (<5s per test)

### 2.3 Pattern Tests
- **Location:** `tests/unit/patterns/`
- **Scope:** Design pattern correctness
- **Dependencies:** Mocked Prisma
- **Speed:** Fast

---

## 3. Test Infrastructure

### 3.1 Prisma Mocking
```typescript
// tests/setup.ts
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

jest.mock('../src/patterns/singleton/DatabaseManager', () => ({
  prisma: prismaMock,
  DatabaseManager: { getInstance: () => prismaMock },
}));
```

### 3.2 Mock Data
```typescript
// tests/mocks/data.mock.ts
export const mockUser = {
  user_id: 1,
  email: 'rahim@pollibondhu.test',
  password_hash: '$2a$12$hashedpassword',
  full_name: 'Rahim Uddin',
  role: 'CITIZEN',
  is_active: true,
  // ...
};

export const mockAdmin = { ... };
export const mockOfficer = { ... };
export const mockServiceProvider = { ... };
export const mockService = { ... };
export const mockComplaint = { ... };
export const mockApplication = { ... };
```

### 3.3 Test Helpers
```typescript
// tests/helpers/auth.ts
import jwt from 'jsonwebtoken';

export function generateTestToken(user: { user_id: number; email: string; role: string }) {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
```

---

## 4. Test Matrix

### 4.1 Authentication Tests

| Test Case | Type | Expected |
|-----------|------|----------|
| Register with valid data | Unit | Returns user + tokens |
| Register with duplicate email | Unit | Throws "Email already registered" |
| Register with invalid email | Integration | 400 validation error |
| Register with short password | Integration | 400 validation error |
| Login with valid credentials | Unit | Returns user + tokens |
| Login with wrong password | Unit | Throws "Invalid credentials" |
| Login with non-existent email | Unit | Throws "Invalid credentials" |
| Login with deactivated account | Unit | Throws "Account deactivated" |
| Refresh with valid token | Integration | Returns new access token |
| Refresh with expired token | Integration | 401 error |
| Refresh with revoked token | Integration | 401 error |
| Logout invalidates refresh token | Integration | Token no longer works |

### 4.2 RBAC Tests

| Test Case | Type | Expected |
|-----------|------|----------|
| Access protected route without token | Integration | 401 |
| Access admin route as CITIZEN | Integration | 403 |
| Access admin route as SUB_ADMIN (own dept) | Integration | 200 |
| Access admin route as SUB_ADMIN (other dept) | Integration | 403 |
| Access officer route as OFFICER (assigned case) | Integration | 200 |
| Access officer route as OFFICER (unassigned case) | Integration | 403 |
| Access citizen data as admin | Integration | 403 (private data) |
| Access own data as citizen | Integration | 200 |
| Access other citizen's data as citizen | Integration | 403 |
| AI query respects RBAC | Unit | Filtered response |

### 4.3 Service Tests

| Test Case | Type | Expected |
|-----------|------|----------|
| Create service as provider | Unit | Service with PENDING status |
| Approve service as admin | Unit | Service status → APPROVED |
| Approve service triggers notification | Unit | Observer creates notification |
| Update service as owner | Unit | Success |
| Update service as non-owner | Unit | Throws "Unauthorized" |
| Delete service as non-owner | Unit | Throws "Unauthorized" |
| List public services | Integration | Paginated list |
| Search services by location | Integration | Filtered results |

### 4.4 Application Tests

| Test Case | Type | Expected |
|-----------|------|----------|
| Create application as citizen | Unit | Application with SUBMITTED status |
| Process application as assigned officer | Unit | Status update |
| Process application as unassigned officer | Unit | Throws "Not assigned" |
| Upload document to application | Unit | Document created |
| Get application timeline | Unit | Update history |
| Citizen cannot see other's applications | Unit | Filtered results |
| Officer sees only assigned applications | Unit | Filtered results |

### 4.5 Complaint Tests

| Test Case | Type | Expected |
|-----------|------|----------|
| Submit complaint | Unit | Complaint with SUBMITTED status |
| Assign complaint to officer | Unit | Complaint assigned |
| Update complaint status | Unit | Status updated |
| Resolve complaint triggers notification | Unit | Observer creates notification |
| Citizen verifies resolution | Unit | Status → CLOSED |
| Citizen cannot see other's complaints | Unit | Filtered results |
| Officer sees only assigned complaints | Unit | Filtered results |

### 4.6 Messaging Tests

| Test Case | Type | Expected |
|-----------|------|----------|
| Create direct conversation | Unit | Conversation created |
| Send message | Unit | Message persisted |
| Get conversation messages | Unit | Paginated messages |
| Non-member cannot access conversation | Unit | Throws "Access denied" |
| Mark messages as read | Unit | Read status updated |
| Create department conversation | Unit | Department members added |

### 4.7 Project Tests

| Test Case | Type | Expected |
|-----------|------|----------|
| Create project as sub-admin | Unit | Project created |
| Update project progress | Unit | Progress updated |
| Add budget allocation | Unit | Budget created |
| Citizen provides feedback | Unit | Feedback created |
| Public sees project progress | Unit | Aggregated data |

### 4.8 Notification Tests

| Test Case | Type | Expected |
|-----------|------|----------|
| Create notification via observer | Unit | Notification created |
| Mark notification as read | Unit | Read status updated |
| Get unread count | Unit | Correct count |
| Mark all as read | Unit | All marked |

### 4.9 Design Pattern Tests

| Pattern | Test Case | Expected |
|---------|-----------|----------|
| Singleton | DatabaseManager returns same instance | Same reference |
| Singleton | Logger returns same instance | Same reference |
| Factory | Create IN_APP notification | Correct type |
| Factory | Create EMAIL notification | Email prefix |
| Factory | Create SYSTEM announcement | High priority |
| Factory | Unknown type throws | Error thrown |
| Strategy | ServiceSearch searches services | Prisma called |
| Strategy | SearchContext switches strategy | Different Prisma model called |
| Observer | Notify calls all observers | All update() called |
| Observer | SERVICE_APPROVED creates notification | Notification created |
| Observer | Audit log created for admin actions | AuditLog created |
| Facade | Dashboard stats aggregated | Correct counts |
| Facade | Weekly stats calculated | Correct aggregation |

### 4.10 Integration API Tests

| Endpoint | Method | Test |
|----------|--------|------|
| /health | GET | Returns success |
| /api/auth/register | POST | Registers user |
| /api/auth/register | POST | Rejects invalid data |
| /api/auth/login | POST | Authenticates user |
| /api/auth/login | POST | Rejects wrong password |
| /api/users/profile | GET | Returns profile |
| /api/users/profile | GET | Rejects without token |
| /api/admin/dashboard | GET | Returns stats |
| /api/admin/dashboard | GET | Rejects non-admin |
| /api/services | GET | Lists services |
| /api/services | POST | Creates service |
| /api/complaints | POST | Creates complaint |
| /api/agriculture/crops | GET | Lists crops |
| /api/agriculture/market-prices | GET | Lists prices |
| /api/agriculture/weather | GET | Returns weather |

---

## 5. Coverage Targets

### 5.1 By Layer

| Layer | Current | Target | Priority |
|-------|---------|--------|----------|
| Services | 77% | 85% | High |
| Patterns | 84% | 95% | High |
| Controllers | 64% | 75% | Medium |
| Repositories | 0% | 70% | Medium |
| Validators | 90% | 95% | Low |
| Middleware | 50% | 80% | High |
| Utils | 70% | 85% | Low |

### 5.2 Overall Target

| Metric | Current | Target |
|--------|---------|--------|
| Statements | ~72% | 70%+ |
| Branches | ~68% | 70%+ |
| Functions | ~75% | 70%+ |
| Lines | ~72% | 70%+ |

---

## 6. Mocking Strategy

### 6.1 External Services

| Service | Mock Method | Purpose |
|---------|-------------|---------|
| Prisma Client | jest-mock-extended | Isolate database |
| bcryptjs | jest.mock | Skip hashing |
| jsonwebtoken | jest.mock | Skip verification |
| Groq AI | jest.mock | Skip API calls |
| Socket.io | jest.mock | Skip real-time |
| File system | jest.mock | Skip file operations |
| Winston | Silent transport | Suppress logs |

### 6.2 Mock Patterns

```typescript
// Mock entire module
jest.mock('../src/patterns/singleton/DatabaseManager', () => ({
  prisma: prismaMock,
}));

// Mock specific method
jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');

// Mock with implementation
prismaMock.user.findUnique.mockImplementation(({ where }) => {
  if (where.email === 'test@test.com') return Promise.resolve(mockUser);
  return Promise.resolve(null);
});
```

---

## 7. Test Execution

### 7.1 Commands

```bash
# Run all tests
cd backend && npm test

# Run with coverage
cd backend && npm test -- --coverage

# Run specific test file
cd backend && npx jest tests/unit/services/auth.service.test.ts

# Run specific test suite
cd backend && npx jest -t "AuthService"

# Watch mode
cd backend && npm run test:watch

# Run integration tests only
cd backend && npx jest tests/integration/
```

### 7.2 CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    cd backend
    npm ci
    npx prisma generate
    npm test -- --coverage --ci
  
- name: Check Coverage
  run: |
    # Fail if coverage below 70%
    npx jest --coverage --coverageThreshold='{"global":{"lines":70,"branches":70}}'
```

---

## 8. Testing Checklist

### Before Each Phase
- [ ] All existing tests pass
- [ ] No regression in coverage
- [ ] New code has corresponding tests
- [ ] RBAC boundaries tested
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Integration tests for new endpoints

### Test Quality Checklist
- [ ] Tests are independent (no shared state)
- [ ] Tests have clear, descriptive names
- [ ] Tests verify behavior, not implementation
- [ ] Mocks are properly reset between tests
- [ ] No flaky tests (timing-dependent)
- [ ] Test data is realistic (Bangladesh context)
