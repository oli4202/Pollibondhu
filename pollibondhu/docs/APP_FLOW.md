# Application Flow (APP_FLOW.md)
## PolliBondhu — Screen Structure & User Journeys

---

## 1. Navigation Architecture

### 1.1 Public Navigation (Unauthenticated)
```
┌──────────────────────────────────────────────────┐
│  🌿 PolliBondhu    Home | Market | Agriculture | │
│                    Services | Community           │
│                              [Login] [Register]   │
└──────────────────────────────────────────────────┘
```

### 1.2 Citizen Dashboard Navigation
```
┌──────────┬──────────────────────────────────────┐
│ Sidebar  │                                      │
│          │         Content Area                 │
│ 📊 Dash  │                                      │
│ 👤 Prof  │                                      │
│ 📋 Apps  │                                      │
│ 📄 Docs  │                                      │
│ ⚠️ Comp  │                                      │
│ 💬 Msgs  │                                      │
│ 🔔 Notif │                                      │
│ 💳 Pays  │                                      │
│ 🤖 AI    │                                      │
│          │                                      │
│ [Logout] │                                      │
└──────────┴──────────────────────────────────────┘
```

### 1.3 Admin Navigation
```
┌──────────┬──────────────────────────────────────┐
│ Sidebar  │                                      │
│ (Dark)   │         Content Area                 │
│          │                                      │
│ 📊 Dash  │                                      │
│ 👥 Users │                                      │
│ 🏛️ Depts │                                      │
│ 📋 Apps  │                                      │
│ ⚠️ Comp  │                                      │
│ 🏗️ Projs │                                      │
│ 💰 Budget│                                      │
│ 📰 News  │                                      │
│ 📢 Announce│                                    │
│ 🔐 Audit │                                      │
│ ⚙️ Settings│                                    │
│          │                                      │
│ [Logout] │                                      │
└──────────┴──────────────────────────────────────┘
```

---

## 2. Screen Map

### 2.1 Public Screens
| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Landing Page | Hero, stats, service cards, CTA |
| `/services` | Government Services | Service catalog with categories |
| `/services/:id` | Service Detail | Full service info, eligibility, apply |
| `/agriculture` | Agriculture Hub | Crops, advisory, weather, subsidies |
| `/marketplace` | Market Prices | Live crop prices, trends |
| `/community` | Community Forum | Posts, discussions, polls |
| `/healthcare` | Healthcare | Health facilities, blood donation |
| `/education` | Education | Institutions, courses |
| `/emergency` | Emergency | Contacts, disaster alerts |
| `/news` | Local News | Announcements, events |
| `/login` | Login | Email + password authentication |
| `/register` | Register | New account creation |

### 2.2 Citizen Screens
| Route | Screen | Description |
|-------|--------|-------------|
| `/dashboard` | Dashboard | Weather, quick links, activity |
| `/dashboard/profile` | Profile | Personal info, documents, settings |
| `/dashboard/applications` | My Applications | Application list with status |
| `/dashboard/applications/:id` | Application Detail | Tracking, documents, messages |
| `/dashboard/complaints` | My Complaints | Complaint list with status |
| `/dashboard/complaints/new` | New Complaint | Complaint submission form |
| `/dashboard/complaints/:id` | Complaint Detail | Status timeline, updates |
| `/dashboard/messages` | Messages | Chat list, conversations |
| `/dashboard/notifications` | Notifications | Notification feed |
| `/dashboard/documents` | My Documents | Uploaded documents |

### 2.3 Officer Screens
| Route | Screen | Description |
|-------|--------|-------------|
| `/officer` | Dashboard | Tasks, applications, complaints |
| `/officer/applications` | Applications | Assigned applications queue |
| `/officer/applications/:id` | Process Application | Review, approve, reject |
| `/officer/complaints` | Complaints | Assigned complaints |
| `/officer/complaints/:id` | Handle Complaint | Update status, notes |
| `/officer/messages` | Messages | Citizen communications |
| `/officer/citizens` | My Citizens | Assigned citizens list |

### 2.4 Sub-Admin Screens
| Route | Screen | Description |
|-------|--------|-------------|
| `/admin` | Dashboard | Department overview, KPIs |
| `/admin/users` | User Management | Search, filter, manage users |
| `/admin/departments` | Departments | Department CRUD |
| `/admin/officers` | Officers | Officer assignment |
| `/admin/services` | Services | Service moderation |
| `/admin/applications` | Applications | Application oversight |
| `/admin/complaints` | Complaints | Complaint management |
| `/admin/projects` | Projects | Project management |
| `/admin/budgets` | Budgets | Budget tracking |
| `/admin/announcements` | Announcements | Create/manage announcements |
| `/admin/reports` | Reports | Analytics and reporting |

### 2.5 Super Admin Screens
| Route | Screen | Description |
|-------|--------|-------------|
| `/super` | Global Dashboard | Platform-wide KPIs |
| `/super/users` | All Users | Global user management |
| `/super/roles` | Roles & Permissions | RBAC configuration |
| `/super/departments` | All Departments | Department management |
| `/super/villages` | Villages | Location hierarchy |
| `/super/organisations` | Organisations | NGOs, institutions |
| `/super/services` | All Services | Service oversight |
| `/super/projects` | All Projects | Project transparency |
| `/super/budgets` | All Budgets | Budget oversight |
| `/super/complaints` | All Complaints | Complaint oversight |
| `/super/news` | News Management | Content management |
| `/super/audit` | Audit Logs | System audit trail |
| `/super/settings` | System Settings | Platform configuration |

---

## 3. Core User Journeys

### 3.1 New Citizen Registration Flow
```
Landing Page
  → [Register Free] button
  → Registration Form (name, email, phone, NID, password, district)
  → Email/Phone Verification (future)
  → Profile Setup (occupation, land holding, family)
  → Dashboard (personalized with location-based content)
```

### 3.2 Government Service Application Flow
```
Services Page (public)
  → Browse by category → Service Detail
  → [Apply Now] (requires login → redirect)
  → Application Form
    → Fill personal info (pre-filled from profile)
    → Upload required documents
    → Review & Submit
  → Confirmation (tracking ID: APP-2024-XXXX)
  → My Applications (status: SUBMITTED)
  → Officer reviews (status: REVIEWING)
  → Additional documents requested? → Upload → Status: RESUBMITTED
  → Approved (status: APPROVED) → Notification
  → Certificate/document ready for download
```

### 3.3 Complaint Lifecycle Flow
```
Citizen: New Complaint
  → Select category (Infrastructure, Health, Agriculture, etc.)
  → Add location (GPS or manual)
  → Description + photos
  → Submit → Tracking ID: COMP-2024-XXXX
  → Status: SUBMITTED

Sub-Admin/Officer:
  → Reviews complaint → Status: REVIEWING
  → Assigns to officer → Status: ASSIGNED
  → Officer works on it → Status: IN_PROGRESS
  → Officer resolves → Status: RESOLVED
  → Citizen verifies resolution → Status: CLOSED
  
  OR
  
  → Citizen disputes → Status: REOPENED
  → Re-investigation → Status: IN_PROGRESS
```

### 3.4 Agriculture Advisory Flow
```
Agriculture Hub
  → Crop Advisory tab
    → Select season (Rabi/Kharif)
    → Select crop → View advisory
    → Save advisory (optional)
  → Market Prices tab
    → View live prices
    → Filter by crop/market
    → See trend (up/down)
  → Weather tab
    → Current weather for district
    → Farming recommendation
  → Subsidies tab
    → Browse active subsidies
    → Apply for subsidy
  → Soil Testing tab
    → Multi-step request form
    → Officer visits for sample collection
```

### 3.5 Messaging Flow
```
Messages Page
  → Conversation List (1-to-1, department, groups)
  → [New Message] → Select recipient
  → Chat View
    → Type message → Send
    → Attach image/document
    → See typing indicator
    → See read/delivered status
  → Department Chat
    → All department members
    → Official communications
  → Complaint-Linked Chat
    → Chat related to specific complaint
    → Context preserved
```

### 3.6 AI Assistant Flow
```
AI Chat Widget (floating button, bottom-right)
  → Opens chat panel
  → Welcome message (role-aware)
  → User types question
  → Frontend checks permissions (useAIHelper hook)
  → If allowed: Send to /api/ai/chat
  → Backend: Enforce RBAC on system prompt
  → Response displayed in chat
  → Quick actions: "Find services", "Track application", "File complaint"
```

---

## 4. State Management Flow

### 4.1 Authentication State
```
App Load
  → Check localStorage for accessToken
  → If exists: GET /api/users/profile
    → Success: Set user state, permissions, assignments
    → Failure: Clear tokens, show public layout
  → If no token: Show public layout
```

### 4.2 Data Fetching
```
Page Load
  → TanStack Query: useQuery(key, fetchFn)
  → If cached: Show cached data immediately
  → If stale: Background refetch
  → Loading: Show skeleton/spinner
  → Error: Show error state with retry
  → Empty: Show empty state with CTA
```

### 4.3 Optimistic Updates
```
User Action (e.g., approve service)
  → Optimistic: Update UI immediately
  → Mutation: PUT /api/services/:id/approve
  → On success: Confirm update
  → On failure: Rollback UI, show error toast
```

---

## 5. Error Handling Flow

```
API Error Response
  → 400: Show validation error message
  → 401: Clear tokens, redirect to login
  → 403: Show "Access denied" message
  → 404: Show "Not found" page
  → 500: Show "Server error" with retry option
  → Network: Show "Connection lost" with retry
```

---

## 6. Redirect Rules

| Condition | Redirect |
|-----------|----------|
| Unauthenticated + protected route | `/login?next={current_path}` |
| Authenticated + `/login` or `/register` | `/dashboard` |
| USER role + `/admin` | `/dashboard` |
| ADMIN role + `/dashboard` | `/admin` |
| SUB_ADMIN role + `/admin` | `/admin` |
| OFFICER role + `/admin` | `/officer` |
| PROVIDER role + `/dashboard` | `/provider` |
