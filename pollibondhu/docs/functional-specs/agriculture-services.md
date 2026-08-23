# Agriculture Services — Functional Specification

Summary
- Page: Agriculture Services (feature area pictured in screenshot)
- Route: `/agriculture` (frontend: `frontend/src/pages/public/Agriculture.tsx`)
- Purpose: Surface government and NGO agricultural services/subsidies to farmers; allow filtering, viewing details, and applying.

Primary UX flows
1. Browse services by category tabs (e.g., Crop Advisory, Market Prices, Agri Weather, Subsidies, Soil Testing).
   - Click a tab → filter list; active tab highlighted.
2. Review service cards (grid, 2 columns on wide, 1 column mobile).
   - Each card shows: icon, title (Bangla + English optional), provider (short), short benefit line (e.g., "Up to 50% discount"), status pill (Open/Closed), deadline or date badge, large call-to-action button.
3. Open service details (card click or "Open" pill/action) → show detail panel or dedicated route/modal.
4. Apply flow:
   - If service is Open: green `Apply Now` button enabled → opens application form (modal or new route).
   - If Closed: disabled grey CTA reads `Applications Closed` and is non-interactive.
   - Application form validates required fields, handles auth (redirect to `/login` if anonymous), shows spinner & success/failure toast.
5. Track application status: CTA or link to `My applications` that shows progress timeline.

Page components
- `AgriculturePage` (page container) — coordinate data fetching, filters, and layout. (frontend: `src/pages/public/Agriculture.tsx`)
- `ServiceTabs` — renders category tabs, active state, keyboard navigation.
- `ServiceGrid` — grid wrapper that maps `ServiceCard` items.
- `ServiceCard` — props: `service: Service`, `onApply(service)`, `onView(service)`; shows header, meta, CTA.
- `ServiceDetailModal` — shows full details, expanded description, documents, apply button.
- `ApplyForm` — used inline or inside modal/route for submitting applications.
- `StatusPill` — small badge for Open/Closed/Ongoing.
- `DateBadge` — calendar icon + date/ongoing label.

Component props & types (TypeScript)
- Service (frontend)
  - id: number
  - slug?: string
  - title: string
  - title_bn?: string
  - provider: string
  - short_description: string
  - full_description?: string
  - benefit?: string
  - status: 'OPEN' | 'CLOSED' | 'ONGOING'
  - apply_deadline?: string (ISO date) | null
  - updated_at?: string
  - icon?: string (SVG name)
  - category: string
  - application_url?: string (external)

- Application (frontend)
  - service_id: number
  - applicant_id?: number
  - payload: object (depends on service fields)
  - status: 'SUBMITTED' | 'PROCESSING' | 'APPROVED' | 'REJECTED'

API contract (recommended)
- GET /api/agriculture/services
  - Query params: `category?`, `status?`, `page?`, `limit?`, `search?`
  - Response 200: { data: Service[], meta: { page, limit, total } }
- GET /api/agriculture/services/:id
  - Response 200: { data: Service }
  - 404 if not found
- POST /api/agriculture/services/:id/apply
  - Auth required (401 if missing)
  - Body: { applicant: { name, phone, nid?, district? }, answers?: Record<string,string> }
  - Response 201: { data: { application_id, status } }
  - 400 for validation errors
  - 409 for duplicate application if business rule enforces uniqueness
- GET /api/users/:id/applications  (My applications)
  - Auth required
  - Response 200: { data: Application[] }

Backend data model suggestions (Prisma-like)
model Service {
  id            Int       @id @default(autoincrement())
  slug          String?   @unique
  title         String
  title_bn      String?
  provider      String
  short_description String
  full_description String?
  benefit       String?
  status        String   // 'OPEN'|'CLOSED'|'ONGOING'
  apply_deadline DateTime?
  category      String
  icon          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Application {
  id         Int      @id @default(autoincrement())
  serviceId  Int
  userId     Int?
  payload    Json
  status     String   @default("SUBMITTED")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  Service    Service  @relation(fields: [serviceId], references: [id])
}

UX & interaction details (every click/state)
- Page load: show skeleton cards while `GET /services` resolves.
- Tab click: update UI immediately (optimistic filter) and refetch with `category` param.
- Card hover: subtle lift and shadow; clicking anywhere on card opens `ServiceDetailModal` except when clicking CTA.
- CTA `Apply Now` click:
  - If user not logged in → save intended action in local state and redirect to `/login?next=/agriculture`.
  - If logged in → open `ApplyForm` modal.
  - During submit: disable button, show spinner, POST to `/services/:id/apply`.
  - On success: toast `Application submitted`, navigate to `My applications` view or show inline confirmation.
  - On error: show toast with friendly message; if validation error, show field errors.
- Closed services: show `Closed` pill and a disabled grey CTA with `Applications Closed`.
- Date display: if `apply_deadline` exists show calendar icon + formatted date; if not, show `Ongoing`.

Edge cases & error handling
- No services returned: show empty state with explanation and action `Check again later` + `Subscribe to updates` CTA.
- Partial failures: if market prices / weather widgets fail, fail silently and show "Data unavailable" badges.
- Rate limits / retries: client should retry 1 time on transient network errors for GETs, show offline banner if fetch repeatedly fails.
- Concurrent apply attempts: server should respond with 409; client should show a helpful message.

Accessibility
- Keyboard: all interactive elements reachable with Tab; `ServiceCard` clickable region must be a button/link with aria role.
- Modal: trap focus while open, return focus to originating CTA on close.
- ARIA: `aria-label` for tabs, `aria-pressed` for active tab, `aria-live` for toast messages.
- Color contrast: ensure status pills and primary CTA have sufficient contrast (check WCAG AA).
- Labels: form inputs must have explicit labels; icons must have descriptive `aria-hidden` or `aria-label` as appropriate.

Assets
- Icons: `subsidy.svg`, `tractor.svg`, `insurance.svg`, `irrigation.svg`, `soil.svg` (24x24 and 48x48 svg versions).
- Badge & pill backgrounds: small rounded SVG or use Tailwind utilities.
- Export suggestions: SVG for icons and logos; PNG fallbacks at 2x for older browsers if needed.

Testing checklist
- Unit:
  - `ServiceCard` renders states: Open, Closed, Ongoing.
  - `ServiceTabs` keyboard navigation and ARIA.
  - `ApplyForm` validation rules and disabled state.
- Integration:
  - `AgriculturePage` fetch flow: skeleton → data → error state.
  - Apply flow: logged-out redirect → login → continue apply.
- E2E (Cypress/Playwright):
  - Browse categories, open a service, submit application, verify `My applications` entry.

Implementation notes for the existing codebase
- Route already exists as `/agriculture` in `frontend/src/routes/AppRoutes.tsx` (see `AgriculturePage` import). Ensure `frontend/src/pages/public/Agriculture.tsx` matches this spec.
- Reuse existing `ToastProvider`, `AuthContext`, and `api` helper (`frontend/src/utils/api.ts`) for network calls.
- Place new components under `frontend/src/components/agriculture/` and reuse `components/ui` primitives where possible.

Next steps (I will proceed unless you ask otherwise)
- Create the spec file (done).
- Audit `frontend/src/pages/public/Agriculture.tsx` and `frontend/src/components` to find differences from this spec and propose concrete code changes.
- Implement `ServiceCard` + `ServiceDetailModal` and wire `GET /api/agriculture/services`.

If you want me to continue, I will now audit the `frontend` files to identify gaps and start implementing the components. Otherwise tell me which other page spec to generate next (e.g., `Services` or `Dashboard`).
