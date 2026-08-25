# UI/UX Design Brief
## PolliBondhu — Design System & Interface Guidelines

**Version:** 2.0  
**Date:** August 2026  

---

## 1. Design Audit — Current Issues

### 1.1 Navigation Problems
- Public nav has 5 links; missing Healthcare, Education, NGOs, Emergency
- No mobile hamburger menu for dashboard layouts
- Admin sidebar hidden on mobile with no alternative
- No breadcrumbs for deep navigation

### 1.2 Information Overload
- AdminDashboard shows 10 KPI cards simultaneously — overwhelming
- Agriculture page has 5 tabs with dense content each
- Services page has 16 filter chips in one row

### 1.3 Inconsistent Styling
- Public pages: Dark glassmorphism with blur effects
- Dashboard pages: White/light theme
- Admin sidebar: Dark earth-900
- Provider dashboard: Purple gradient
- No unified colour system across contexts

### 1.4 Poor Mobile Experience
- PublicLayout: Works with hamburger
- DashboardLayout: Sidebar hidden, no mobile nav
- AdminLayout: Sidebar hidden, no mobile nav
- Tables don't scroll horizontally on mobile
- Modals overflow on small screens

### 1.5 Missing States
- No loading skeletons (only spinners)
- No empty state components (ad-hoc text)
- No error boundary for frontend errors
- No offline state indicator

### 1.6 Component Gaps
- No form components (raw HTML inputs)
- No modal/dialog component
- No tabs component
- No breadcrumb component
- No confirmation dialog (uses window.confirm)
- No avatar component
- No skeleton loading component
- No tooltip component
- No dropdown menu component

### 1.7 Typography
- Hind Siliguri (Bengali) + Outfit (English) loaded from Google Fonts
- No consistent type scale defined
- Inconsistent font sizes across pages (text-xs to text-7xl)
- Heading hierarchy not enforced

### 1.8 Colour Usage
- CSS variables defined but not consistently used
- Hardcoded colours in many components (bg-[#00A63C])
- No semantic colour tokens (success, warning, error, info)
- Contrast ratios not verified for accessibility

---

## 2. Design Principles

1. **Clean**: Minimal decoration, clear hierarchy, breathing room
2. **Modern**: Contemporary patterns, subtle animations, professional feel
3. **Trustworthy**: Government-appropriate, not playful or gimmicky
4. **Accessible**: WCAG AA contrast, keyboard navigation, screen reader support
5. **Bangladesh-friendly**: Bengali-first typography, local colour sensibilities
6. **Easy for low-tech users**: Large touch targets, clear labels, forgiving interactions
7. **Responsive**: Mobile-first, works from 320px to 1920px
8. **Consistent**: Same component, same behaviour, everywhere

---

## 3. Design System

### 3.1 Colour Tokens

#### Primary (Polli Green)
```
--color-primary-50:  #f0fdf4
--color-primary-100: #dcfce7
--color-primary-200: #bbf7d0
--color-primary-300: #86efac
--color-primary-400: #4ade80
--color-primary-500: #22c55e
--color-primary-600: #16a34a
--color-primary-700: #15803d
--color-primary-800: #166534
--color-primary-900: #14532d
```

#### Neutral (Earth)
```
--color-neutral-50:  #fafaf9
--color-neutral-100: #f5f5f4
--color-neutral-200: #e7e5e4
--color-neutral-300: #d6d3d1
--color-neutral-400: #a8a29e
--color-neutral-500: #78716c
--color-neutral-600: #57534e
--color-neutral-700: #44403c
--color-neutral-800: #292524
--color-neutral-900: #1c1917
```

#### Semantic
```
--color-success: #16a34a
--color-success-bg: #f0fdf4
--color-warning: #d97706
--color-warning-bg: #fffbeb
--color-error: #dc2626
--color-error-bg: #fef2f2
--color-info: #2563eb
--color-info-bg: #eff6ff
```

#### Background
```
--color-bg-primary: #ffffff
--color-bg-secondary: #f5f5f4
--color-bg-sidebar: #1c1917  (admin)
--color-bg-sidebar: #ffffff  (citizen)
```

### 3.2 Typography Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `display` | 3rem/48px | 700 | Landing page hero |
| `h1` | 2rem/32px | 700 | Page titles |
| `h2` | 1.5rem/24px | 600 | Section headings |
| `h3` | 1.25rem/20px | 600 | Card titles |
| `h4` | 1rem/16px | 600 | Sub-headings |
| `body` | 0.9375rem/15px | 400 | Body text |
| `body-sm` | 0.8125rem/13px | 400 | Secondary text |
| `caption` | 0.75rem/12px | 400 | Labels, timestamps |
| `badge` | 0.6875rem/11px | 700 | Badges, tags |

### 3.3 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Component internal gaps |
| `space-3` | 12px | Card padding |
| `space-4` | 16px | Standard gaps |
| `space-5` | 20px | Section padding |
| `space-6` | 24px | Card padding (large) |
| `space-8` | 32px | Section spacing |
| `space-10` | 40px | Page section spacing |
| `space-12` | 48px | Major section spacing |

### 3.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Badges, small buttons |
| `radius-md` | 8px | Inputs, buttons |
| `radius-lg` | 12px | Cards |
| `radius-xl` | 16px | Modals, large cards |
| `radius-full` | 9999px | Pills, avatars |

---

## 4. Component Specifications

### 4.1 Button
```
Variants: primary (green), secondary (outline), danger (red), ghost (text)
Sizes: sm (32px), md (40px), lg (48px)
States: default, hover, active, disabled, loading
Icon support: leading icon, trailing icon, icon-only
```

### 4.2 Card
```
Variants: default (white bg), elevated (shadow), outlined (border)
Padding: p-5 (20px)
Border radius: radius-lg (12px)
Border: 1px solid neutral-200
Shadow: sm (0 1px 2px rgba(0,0,0,0.05))
```

### 4.3 Input
```
Height: 40px (md)
Padding: px-3 py-2
Border: 1px solid neutral-300
Border radius: radius-md (8px)
Focus: ring-2 ring-primary-500, border-primary-500
Error: border-error, error message below
Label: above input, body-sm, neutral-600
Helper text: below input, caption, neutral-400
```

### 4.4 Badge/Tag
```
Variants: default (neutral), success (green), warning (amber), danger (red), info (blue)
Size: sm (padding: 2px 8px), md (padding: 4px 12px)
Border radius: radius-sm (6px) or radius-full
Font: caption (11px), weight 700
```

### 4.5 Table
```
Header: bg neutral-50, text caption uppercase, weight 600
Row: hover:bg neutral-50/50
Border: divide-y neutral-200
Cell padding: px-4 py-3
Mobile: horizontal scroll wrapper
```

### 4.6 Modal/Dialog
```
Overlay: bg-neutral-900/50, backdrop-blur-sm
Container: bg-white, radius-xl, shadow-2xl, max-w-md
Header: px-6 py-4, border-b neutral-200
Body: px-6 py-4
Footer: px-6 py-4, border-t neutral-200, flex gap-3
Close: top-right, neutral-400 hover
```

### 4.7 Tabs
```
Container: border-b neutral-200
Tab: px-4 py-2.5, text-sm, font-semibold
Active: border-b-2 primary-600, text primary-700
Inactive: text neutral-500, hover text neutral-700
Mobile: horizontal scroll
```

### 4.8 Breadcrumbs
```
Items: neutral-500, text-sm
Separator: "/" or chevron-right, neutral-300
Current: neutral-900, font-semibold
Link: hover primary-600
```

### 4.9 Empty State
```
Icon: 48px, neutral-300
Title: h3, neutral-700
Description: body, neutral-500
CTA: primary button
```

### 4.10 Loading Skeleton
```
Animation: pulse (neutral-200 → neutral-100)
Border radius: radius-md
Variants: text, circle, rectangle, card
```

### 4.11 Alert/Toast
```
Variants: success (green), error (red), warning (amber), info (blue)
Icon: leading, 16px
Text: body-sm
Dismiss: X button, auto-dismiss 4s
Position: bottom-right, stacked
```

### 4.12 Avatar
```
Sizes: sm (32px), md (40px), lg (56px), xl (80px)
Fallback: first letter of name, primary bg
Image: object-cover, rounded-full
```

---

## 5. Layout Guidelines

### 5.1 Public Pages
- Full-width hero sections
- Content constrained to max-w-7xl (1280px)
- Generous vertical spacing (space-12 between sections)
- Footer with dark background

### 5.2 Dashboard Pages
- Fixed sidebar (256px) on desktop
- Collapsible sidebar on tablet
- Bottom tab bar on mobile
- Content area with padding (space-6 to space-8)
- Background: neutral-50

### 5.3 Admin Pages
- Dark sidebar (earth-900) on desktop
- White content area
- Breadcrumbs at top
- Page title + description pattern

---

## 6. Mobile Guidelines

- **Minimum touch target**: 44px × 44px
- **Sidebar**: Becomes bottom tab bar on mobile (<768px)
- **Tables**: Horizontal scroll on mobile
- **Modals**: Full-screen on mobile (<640px)
- **Cards**: Stack vertically on mobile
- **Navigation**: Hamburger menu for public, bottom tabs for dashboard
- **Forms**: Full-width inputs, stacked labels

---

## 7. Accessibility Requirements

- **Colour contrast**: Minimum 4.5:1 for text, 3:1 for large text
- **Focus indicators**: Visible ring on all interactive elements
- **Keyboard navigation**: Tab order logical, escape closes modals
- **Alt text**: All images must have descriptive alt text
- **ARIA labels**: Interactive elements must have accessible names
- **Form labels**: All inputs must have associated labels
- **Error messages**: Associated with inputs via aria-describedby
- **Skip link**: "Skip to main content" for keyboard users

---

## 8. Animation Guidelines

- **Duration**: 150ms (micro), 200ms (small), 300ms (standard)
- **Easing**: ease-in-out for most transitions
- **Hover effects**: Subtle scale (1.02) or shadow increase
- **Page transitions**: Fade-in (opacity 0→1)
- **Loading**: Pulse for skeletons, spin for spinners
- **Avoid**: Excessive bouncing, parallax on low-end devices, auto-playing animations

---

## 9. Bangladesh-Specific Considerations

- **Bengali text**: Longer than English — allow 30% more space
- **Currency**: ৳ (Taka) symbol before amount, comma-separated thousands
- **Date format**: DD MMM YYYY (e.g., ২৩ আগস্ট ২০২৬)
- **Time format**: 12-hour with AM/PM
- **Phone format**: 01XXXXXXXXX (11 digits)
- **NID format**: 10 or 17 digits
- **District names**: Use English transliteration (Dhaka, Rajshahi)
- **Colour sensitivity**: Green associated with agriculture/growth, avoid political party colours
