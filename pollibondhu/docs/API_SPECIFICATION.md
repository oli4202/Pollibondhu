# API Specification (API_SPECIFICATION.md)
## PolliBondhu — REST API Endpoints

**Version:** 2.0  
**Base URL:** `/api`  
**Content-Type:** `application/json`  

---

## 1. Standard Response Format

### Success
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```

### Success with Pagination
```json
{
  "success": true,
  "data": {
    "data": [],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### Error
```json
{
  "success": false,
  "error": "Error description"
}
```

---

## 2. Authentication Endpoints

### POST /api/auth/register
**Auth:** Public  
**Body:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "full_name": "string (required, min 2 chars)",
  "phone": "string (optional, 11 digits)",
  "nid": "string (optional)",
  "district": "string (optional)",
  "division": "string (optional)",
  "upazila": "string (optional)"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "user_id": 1, "email": "...", "full_name": "...", "role": "CITIZEN" },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### POST /api/auth/login
**Auth:** Public  
**Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "user_id": 1, "email": "...", "full_name": "...", "role": "CITIZEN" },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### POST /api/auth/refresh
**Auth:** Public  
**Body:**
```json
{
  "refreshToken": "string (required)"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

### POST /api/auth/logout
**Auth:** Required  
**Body:**
```json
{
  "refreshToken": "string (required)"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. User Endpoints

### GET /api/users/profile
**Auth:** Required  
**Response (200):** User profile without password_hash

### PUT /api/users/profile
**Auth:** Required  
**Body:**
```json
{
  "full_name": "string (optional)",
  "phone": "string (optional)",
  "avatar_url": "string (optional)",
  "district": "string (optional)",
  "division": "string (optional)",
  "upazila": "string (optional)",
  "union_name": "string (optional)",
  "village": "string (optional)"
}
```
**Note:** role, email, password_hash cannot be updated via profile

### GET /api/users
**Auth:** Required  
**Roles:** SUPER_ADMIN, SUB_ADMIN  
**Query:** `page`, `limit`, `role`, `search`, `district`, `status`  
**Response:** Paginated user list

### PUT /api/users/:id/status
**Auth:** Required  
**Roles:** SUPER_ADMIN, SUB_ADMIN  
**Body:** `{ "is_active": boolean }`

### PUT /api/users/:id/role
**Auth:** Required  
**Roles:** SUPER_ADMIN  
**Body:** `{ "role": "string" }`

### PUT /api/users/:id/assign-departments
**Auth:** Required  
**Roles:** SUPER_ADMIN  
**Body:** `{ "department_ids": [1, 2, 3] }`

### PUT /api/users/:id/assign-locations
**Auth:** Required  
**Roles:** SUPER_ADMIN  
**Body:** `{ "location_ids": [1, 2, 3] }`

---

## 4. Role & Permission Endpoints

### GET /api/roles
**Auth:** Required  
**Roles:** SUPER_ADMIN

### POST /api/roles
**Auth:** Required  
**Roles:** SUPER_ADMIN  
**Body:** `{ "name": "string", "description": "string" }`

### PUT /api/roles/:id
**Auth:** Required  
**Roles:** SUPER_ADMIN

### DELETE /api/roles/:id
**Auth:** Required  
**Roles:** SUPER_ADMIN  
**Note:** System roles cannot be deleted

### GET /api/roles/:id/permissions
**Auth:** Required  
**Roles:** SUPER_ADMIN

### PUT /api/roles/:id/permissions
**Auth:** Required  
**Roles:** SUPER_ADMIN  
**Body:** `{ "permission_ids": [1, 2, 3] }`

### GET /api/permissions
**Auth:** Required  
**Roles:** SUPER_ADMIN

---

## 5. Department Endpoints

### GET /api/departments
**Auth:** Required  
**Roles:** SUPER_ADMIN, SUB_ADMIN  
**Query:** `page`, `limit`, `search`

### POST /api/departments
**Auth:** Required  
**Roles:** SUPER_ADMIN  
**Body:** `{ "name": "string", "description": "string" }`

### PUT /api/departments/:id
**Auth:** Required  
**Roles:** SUPER_ADMIN, SUB_ADMIN (own dept)

### DELETE /api/departments/:id
**Auth:** Required  
**Roles:** SUPER_ADMIN

### GET /api/departments/:id/officers
**Auth:** Required  
**Roles:** SUPER_ADMIN, SUB_ADMIN

### POST /api/departments/:id/officers
**Auth:** Required  
**Roles:** SUPER_ADMIN, SUB_ADMIN  
**Body:** `{ "user_id": number }`

---

## 6. Location Endpoints

### GET /api/locations
**Auth:** Required  
**Query:** `type` (DIVISION, DISTRICT, UPAZILA, UNION, VILLAGE), `parent_id`

### GET /api/locations/hierarchy
**Auth:** Required  
**Response:** Full location tree

---

## 7. Service Endpoints

### GET /api/services
**Auth:** Public  
**Query:** `page`, `limit`, `query`, `location`, `category`, `status`

### GET /api/services/:id
**Auth:** Public

### POST /api/services
**Auth:** Required  
**Roles:** SERVICE_PROVIDER, SUB_ADMIN, SUPER_ADMIN  
**Body:**
```json
{
  "name": "string (required)",
  "name_bn": "string (optional)",
  "description": "string",
  "category_id": "number",
  "department_id": "number",
  "fee": "number",
  "processing_time": "string",
  "eligibility": "string (JSON)",
  "required_docs": "string (JSON)"
}
```

### PUT /api/services/:id
**Auth:** Required  
**Roles:** Owner, SUB_ADMIN, SUPER_ADMIN

### DELETE /api/services/:id
**Auth:** Required  
**Roles:** Owner, SUB_ADMIN, SUPER_ADMIN

### PUT /api/services/:id/approve
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

### PUT /api/services/:id/reject
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

### GET /api/service-categories
**Auth:** Public

### POST /api/service-categories
**Auth:** Required  
**Roles:** SUPER_ADMIN

---

## 8. Application Endpoints

### GET /api/applications
**Auth:** Required  
**Roles:** All authenticated users  
**Query:** `page`, `limit`, `status`, `service_id`, `category_id`  
**Scoping:**
- CITIZEN: Own applications only
- OFFICER: Assigned applications only
- SUB_ADMIN: Department applications only
- SUPER_ADMIN: All applications

### GET /api/applications/:id
**Auth:** Required  
**Scoping:** Based on role and assignment

### POST /api/applications
**Auth:** Required  
**Roles:** CITIZEN  
**Body:**
```json
{
  "service_id": "number (optional)",
  "category_id": "number (optional)",
  "applicant_data": "string (JSON form data)"
}
```
**Response:** Application with tracking_id

### PUT /api/applications/:id/process
**Auth:** Required  
**Roles:** OFFICER, SUB_ADMIN, SUPER_ADMIN  
**Body:**
```json
{
  "status": "REVIEWING | ADDITIONAL_DOCS_REQUIRED | PROCESSING | APPROVED | REJECTED",
  "notes": "string",
  "rejection_reason": "string (if rejecting)"
}
```

### POST /api/applications/:id/documents
**Auth:** Required  
**Roles:** CITIZEN (own), OFFICER (assigned)  
**Body:** Multipart form data with files

### GET /api/applications/:id/timeline
**Auth:** Required  
**Response:** Application update history

### POST /api/applications/:id/feedback
**Auth:** Required  
**Roles:** CITIZEN (own)  
**Body:** `{ "rating": number, "feedback": "string" }`

---

## 9. Complaint Endpoints

### GET /api/complaints
**Auth:** Required  
**Query:** `page`, `limit`, `status`, `category`, `priority`, `department_id`  
**Scoping:**
- CITIZEN: Own complaints only
- OFFICER: Assigned complaints only
- SUB_ADMIN: Department complaints only
- SUPER_ADMIN: All complaints

### GET /api/complaints/:id
**Auth:** Required

### POST /api/complaints
**Auth:** Required  
**Roles:** CITIZEN  
**Body:**
```json
{
  "category": "string (required)",
  "subject": "string (required)",
  "description": "string (required, min 10 chars)",
  "location": "string",
  "latitude": "number",
  "longitude": "number",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL"
}
```
**Response:** Complaint with tracking_id (COMP-2024-XXXX)

### PUT /api/complaints/:id/assign
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN  
**Body:** `{ "officer_id": number, "deadline": "ISO date" }`

### PUT /api/complaints/:id/status
**Auth:** Required  
**Roles:** OFFICER (assigned), SUB_ADMIN, SUPER_ADMIN  
**Body:**
```json
{
  "status": "REVIEWING | IN_PROGRESS | RESOLVED",
  "notes": "string",
  "resolution_notes": "string"
}
```

### POST /api/complaints/:id/verify
**Auth:** Required  
**Roles:** CITIZEN (own)  
**Body:** `{ "satisfied": boolean, "feedback": "string", "rating": number }`

### GET /api/complaints/:id/updates
**Auth:** Required  
**Response:** Complaint update timeline

### POST /api/complaints/:id/documents
**Auth:** Required  
**Body:** Multipart form data

---

## 10. Admin Dashboard Endpoints

### GET /api/admin/dashboard
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN  
**Response:**
```json
{
  "totalUsers": 25430,
  "totalServices": 132,
  "pendingComplaints": 146,
  "activeProjects": 72,
  "pendingApplications": 318,
  "recentActivities": []
}
```

### GET /api/admin/dashboard/weekly
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

### GET /api/admin/dashboard/growth?days=30
**Auth:** Required  
**Roles:** SUPER_ADMIN

### GET /api/admin/audit-logs
**Auth:** Required  
**Roles:** SUPER_ADMIN  
**Query:** `page`, `limit`, `admin_id`, `action`, `entity_type`, `from`, `to`

---

## 11. Project & Budget Endpoints

### GET /api/projects
**Auth:** Required (public view for published projects)  
**Query:** `page`, `limit`, `status`, `department_id`

### GET /api/projects/:id
**Auth:** Required

### POST /api/projects
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

### PUT /api/projects/:id
**Auth:** Required  
**Roles:** Assigned officer, SUB_ADMIN, SUPER_ADMIN

### POST /api/projects/:id/updates
**Auth:** Required  
**Roles:** Assigned officer, SUB_ADMIN, SUPER_ADMIN  
**Body:**
```json
{
  "title": "string",
  "description": "string",
  "progress": "number (0-100)",
  "spent": "number",
  "photo_url": "string"
}
```

### GET /api/projects/:id/budgets
**Auth:** Required

### POST /api/projects/:id/budgets
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

### POST /api/projects/:id/feedback
**Auth:** Required  
**Roles:** CITIZEN (public projects)

### GET /api/projects/:id/timeline
**Auth:** Required

---

## 12. Agriculture Endpoints

### GET /api/agriculture/crops
**Auth:** Public  
**Query:** `page`, `limit`, `search`, `season`

### GET /api/agriculture/crops/:id
**Auth:** Public

### GET /api/agriculture/market-prices
**Auth:** Public  
**Query:** `crop_id`, `district`, `market_name`

### GET /api/agriculture/weather
**Auth:** Public  
**Query:** `district`

### GET /api/agriculture/experts
**Auth:** Public  
**Query:** `specialization`, `district`, `verified`

### POST /api/agriculture/soil-test
**Auth:** Required  
**Roles:** CITIZEN

### GET /api/agriculture/seeds
**Auth:** Public

### GET /api/agriculture/fertilizers
**Auth:** Public

---

## 13. Education Endpoints

### GET /api/education/institutions
**Auth:** Public  
**Query:** `type`, `district`, `search`

### GET /api/education/institutions/:id
**Auth:** Public

### POST /api/education/institutions
**Auth:** Required  
**Roles:** SUPER_ADMIN, NGO_ADMIN

### PUT /api/education/institutions/:id
**Auth:** Required  
**Roles:** INSTITUTION_ADMIN (own), SUB_ADMIN, SUPER_ADMIN

### GET /api/education/institutions/:id/courses
**Auth:** Public

### POST /api/education/institutions/:id/courses
**Auth:** Required  
**Roles:** INSTITUTION_ADMIN (own), SUB_ADMIN, SUPER_ADMIN

### GET /api/education/courses/:id/students
**Auth:** Required  
**Roles:** INSTITUTION_ADMIN, TEACHER (own courses)

### POST /api/education/courses/:id/enroll
**Auth:** Required  
**Roles:** CITIZEN (self-enroll)

### GET /api/education/institutions/:id/announcements
**Auth:** Public

### POST /api/education/institutions/:id/announcements
**Auth:** Required  
**Roles:** INSTITUTION_ADMIN (own)

---

## 14. NGO Endpoints

### GET /api/ngos
**Auth:** Public  
**Query:** `type`, `district`, `search`

### GET /api/ngos/:id
**Auth:** Public

### POST /api/ngos
**Auth:** Required  
**Roles:** SUPER_ADMIN

### PUT /api/ngos/:id
**Auth:** Required  
**Roles:** NGO_ADMIN (own), SUPER_ADMIN

### GET /api/ngos/:id/programmes
**Auth:** Public

### POST /api/ngos/:id/programmes
**Auth:** Required  
**Roles:** NGO_ADMIN (own)

### POST /api/ngos/:id/programmes/:programmeId/enroll
**Auth:** Required  
**Roles:** CITIZEN

### POST /api/ngos/:id/donate
**Auth:** Required  
**Roles:** CITIZEN

---

## 15. Messaging Endpoints

### GET /api/conversations
**Auth:** Required  
**Response:** List of user's conversations with last message

### POST /api/conversations
**Auth:** Required  
**Body:**
```json
{
  "type": "DIRECT | GROUP | DEPARTMENT",
  "name": "string (for group/department)",
  "participant_ids": [1, 2, 3]
}
```

### GET /api/conversations/:id/messages
**Auth:** Required (member)  
**Query:** `page`, `limit`, `before` (cursor-based)

### POST /api/conversations/:id/messages
**Auth:** Required (member)  
**Body:**
```json
{
  "content": "string",
  "message_type": "TEXT | IMAGE | DOCUMENT"
}
```

### PUT /api/conversations/:id/read
**Auth:** Required (member)

### GET /api/conversations/:id/members
**Auth:** Required (member)

### POST /api/conversations/:id/members
**Auth:** Required (admin)  
**Body:** `{ "user_id": number }`

---

## 16. Notification Endpoints

### GET /api/notifications
**Auth:** Required  
**Query:** `page`, `limit`, `is_read`, `category`  
**Response:** Paginated notifications, unread count

### PUT /api/notifications/:id/read
**Auth:** Required

### PUT /api/notifications/read-all
**Auth:** Required

### DELETE /api/notifications/:id
**Auth:** Required

---

## 17. Waste Management Endpoints

### GET /api/waste/reports
**Auth:** Required  
**Query:** `status`, `category`, `zone_id`

### POST /api/waste/reports
**Auth:** Required  
**Roles:** CITIZEN

### PUT /api/waste/reports/:id
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN  
**Body:** `{ "status": "string", "assigned_to": "string" }`

### GET /api/waste/zones
**Auth:** Public

### POST /api/waste/zones
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

---

## 18. Emergency Endpoints

### GET /api/emergency/contacts
**Auth:** Public  
**Query:** `type`, `district`

### POST /api/emergency/contacts
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

### PUT /api/emergency/contacts/:id
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

### DELETE /api/emergency/contacts/:id
**Auth:** Required  
**Roles:** SUPER_ADMIN

---

## 19. Event & News Endpoints

### GET /api/events
**Auth:** Public  
**Query:** `type`, `district`, `upcoming`

### GET /api/events/:id
**Auth:** Public

### POST /api/events
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN, NGO_ADMIN, INSTITUTION_ADMIN

### POST /api/events/:id/attend
**Auth:** Required  
**Roles:** CITIZEN

### GET /api/news
**Auth:** Public  
**Query:** `category`, `district`, `page`, `limit`

### GET /api/news/:id
**Auth:** Public

### POST /api/news
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

### PUT /api/news/:id/publish
**Auth:** Required  
**Roles:** SUB_ADMIN, SUPER_ADMIN

---

## 20. Forum Endpoints

### GET /api/forum/posts
**Auth:** Public  
**Query:** `category_id`, `page`, `limit`, `search`

### GET /api/forum/posts/:id
**Auth:** Public

### POST /api/forum/posts
**Auth:** Required  
**Roles:** CITIZEN

### PUT /api/forum/posts/:id
**Auth:** Required  
**Roles:** Owner, SUB_ADMIN

### POST /api/forum/posts/:id/like
**Auth:** Required  
**Roles:** CITIZEN

### GET /api/forum/polls
**Auth:** Public

### POST /api/forum/polls/:id/vote
**Auth:** Required  
**Roles:** CITIZEN

---

## 21. AI Endpoints

### POST /api/ai/chat
**Auth:** Required  
**Body:**
```json
{
  "prompt": "string (required)",
  "context": "string (optional, e.g., 'agriculture', 'services', 'complaints')"
}
```
**Response:**
```json
{
  "response": "AI-generated response",
  "suggestions": ["optional follow-up suggestions"]
}
```

**RBAC Enforcement:**
- System prompt includes user's role
- AI cannot access data beyond user's permissions
- AI responses filtered based on department/location assignments

### GET /api/ai/suggestions
**Auth:** Required  
**Response:** Role-based quick action suggestions

---

## 22. Saved Items Endpoints

### GET /api/saved
**Auth:** Required  
**Query:** `entity_type` (SERVICE, APPLICATION, EVENT, NEWS)

### POST /api/saved
**Auth:** Required  
**Body:** `{ "entity_type": "string", "entity_id": number }`

### DELETE /api/saved/:id
**Auth:** Required

---

## 23. Payment Endpoints

### GET /api/payments
**Auth:** Required  
**Query:** `status`, `purpose`, `page`, `limit`  
**Scoping:** CITIZEN sees own payments only

### POST /api/payments
**Auth:** Required  
**Body:**
```json
{
  "amount": "number",
  "purpose": "string",
  "entity_type": "string (optional)",
  "entity_id": "number (optional)",
  "method": "BKASH | NAGAD | CASH | CARD | BANK"
}
```

### GET /api/payments/:id
**Auth:** Required

---

## 24. File Upload

### POST /api/upload
**Auth:** Required  
**Body:** Multipart form-data  
**Fields:**
- `file`: The file (max 5MB, images: jpg/png/webp, docs: pdf/doc)
- `entity_type`: "APPLICATION", "COMPLAINT", "PROJECT", "PROFILE", "MESSAGE"
- `entity_id`: Associated entity ID

**Response:**
```json
{
  "success": true,
  "data": {
    "file_url": "/uploads/...",
    "file_name": "original-name.jpg",
    "file_size": 1024000,
    "mime_type": "image/jpeg"
  }
}
```

---

## 25. WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:4000', {
  auth: { token: 'jwt_token' }
});
```

### Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `{ conversationId: number }` | Join a chat room |
| `leave_conversation` | `{ conversationId: number }` | Leave a chat room |
| `send_message` | `{ conversationId, content, messageType }` | Send a message |
| `typing_start` | `{ conversationId }` | User started typing |
| `typing_stop` | `{ conversationId }` | User stopped typing |
| `message_read` | `{ conversationId, messageId }` | Message read |

### Server → Client Events
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ conversationId, message }` | New message received |
| `user_typing` | `{ conversationId, userId, userName }` | Someone is typing |
| `user_stopped_typing` | `{ conversationId, userId }` | Someone stopped typing |
| `message_read_receipt` | `{ conversationId, messageId, readBy }` | Read receipt |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |
| `notification` | `{ notification }` | New notification |
