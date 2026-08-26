# PolliBondhu Entity Relationship Diagram

This ERD reflects the Prisma schema in `pollibondhu/backend/prisma/schema.prisma` and is the reference for the next implementation phases. It groups the full schema into readable domain diagrams; the Prisma schema remains the source of truth.

## Core services and civic workflows

```mermaid
erDiagram
  USER ||--o{ SERVICE : provides
  CATEGORY ||--o{ SERVICE : classifies
  USER ||--o{ APPLICATION : submits
  SERVICE ||--o{ APPLICATION : receives
  DEPARTMENT ||--o{ APPLICATION : processes
  APPLICATION ||--o{ APPLICATION_DOCUMENT : contains
  APPLICATION ||--o{ APPLICATION_UPDATE : records
  USER ||--o{ COMPLAINT : files
  USER ||--o{ COMPLAINT : reviews_or_is_assigned
  DEPARTMENT ||--o{ COMPLAINT : owns
  USER ||--o{ SAVED_SERVICE : saves
  SERVICE ||--o{ SAVED_SERVICE : is_saved
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ AUDIT_LOG : performs

  USER { int user_id PK string email UK string role boolean is_active }
  SERVICE { int service_id PK int provider_id FK int category_id FK string status boolean is_available }
  APPLICATION { int application_id PK string tracking_id UK int user_id FK int service_id FK string status }
  COMPLAINT { int complaint_id PK int user_id FK int assigned_to FK string status string priority }
  CATEGORY { int category_id PK string name string type }
```

## RBAC, geography, and account security

```mermaid
erDiagram
  USER ||--o{ USER_ROLE : has
  ROLE ||--o{ USER_ROLE : grants
  ROLE ||--o{ ROLE_PERMISSION : has
  PERMISSION ||--o{ ROLE_PERMISSION : grants
  USER ||--o{ USER_DEPARTMENT : belongs_to
  DEPARTMENT ||--o{ USER_DEPARTMENT : includes
  USER ||--o{ USER_LOCATION : assigned_to
  LOCATION ||--o{ USER_LOCATION : includes
  LOCATION ||--o{ LOCATION : parent_of
  USER ||--o{ REFRESH_TOKEN : owns
  USER ||--o{ PASSWORD_RESET_TOKEN : requests

  USER { int user_id PK string email UK string password_hash }
  ROLE { int role_id PK string name UK }
  PERMISSION { int permission_id PK string name UK string module }
  PASSWORD_RESET_TOKEN { int reset_token_id PK int user_id FK string token_hash datetime expires_at datetime used_at }
```

## Community, chat, education, NGO, and agriculture

```mermaid
erDiagram
  USER ||--o{ FORUM_POST : writes
  USER ||--o{ CHAT_MEMBER : joins
  CHAT_CONVERSATION ||--o{ CHAT_MEMBER : includes
  CHAT_CONVERSATION ||--o{ CHAT_MESSAGE : contains
  USER ||--o{ CHAT_MESSAGE : sends
  CHAT_CONVERSATION ||--o{ PROVIDER_COMPLAINT : concerns
  USER ||--o{ PROVIDER_COMPLAINT : files_or_receives

  INSTITUTION ||--o{ COURSE : offers
  COURSE ||--o{ COURSE_TEACHER : has
  USER ||--o{ COURSE_TEACHER : teaches
  USER ||--|| STUDENT : has_profile
  INSTITUTION ||--o{ STUDENT : enrolls

  ORGANISATION ||--o{ NGO_PROGRAMME : runs
  ORGANISATION ||--o{ ORGANISATION_MEMBER : has
  USER ||--o{ ORGANISATION_MEMBER : joins
  NGO_PROGRAMME ||--o{ PROGRAMME_ENROLMENT : accepts
  USER ||--o{ PROGRAMME_ENROLMENT : enrolls

  CROP ||--o{ MARKET_PRICE : has
  CROP ||--o{ CROP_ADVICE : receives
  USER ||--o{ SOIL_TEST_REQUEST : requests_or_processes
```

## Implementation sequence

1. **Identity and RBAC:** secure reset tokens, normalize public registration to real roles, and enforce ownership/assignment.
2. **Civic workflow:** application assignment, allowed status transitions, document ownership, and complaint lifecycle.
3. **Service marketplace:** moderation history, approved-only visibility, provider resubmission, and saved services.
4. **Supporting modules:** chat, community, education, NGO, agriculture, and marketplace end-to-end tests.
