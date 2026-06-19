# Oddigo v2 — Full Touchup Plan

> Updated: 2026-06-20
> Comprehensive roadmap covering all remaining work across backend, admin dashboard, user app, and worker app.
> Items marked ✅ are already implemented.

---

## Table of Contents

1. [Already Completed](#already-completed)
2. [User Home Page Enhancement](#1-user-home-page-enhancement)
3. [Admin Content Management (CMS)](#2-admin-content-management-cms)
4. [Points / Rewards / Loyalty System](#3-points--rewards--loyalty-system)
5. [Coupon / Discount System](#4-coupon--discount-system)
6. [Dark / Light Mode — All 3 Apps](#5-dark--light-mode--all-3-apps)
7. [shadcn Components Everywhere](#6-shadcn-components-everywhere)
8. [Mobile-First Design Fixes](#7-mobile-first-design-fixes)
9. [Execution Order & Dependencies](#8-execution-order--dependencies)
10. [Notes & Tech Debt](#9-notes--tech-debt)

---

## Already Completed

| # | Feature | Status |
|---|---------|--------|
| ✅ | Seed DB with services (4 categories, 27 sub-services) | Done |
| ✅ | Backend admin service CRUD (8 endpoints) | Done |
| ✅ | Admin services management UI (ServicesListPage, CategoryDetailPage, dialogs) | Done |
| ✅ | Admin sidebar "Services" nav item + routes | Done |
| ✅ | Worker registration service type dropdown | Done |
| ✅ | Backend stores serviceType in WorkerProfile.skills[] during signup | Done |

---

## 1. User Home Page Enhancement

**Current state:** The home page (`ServiceCategoriesPage.tsx`) is just a heading "Choose a Service" + a grid of category cards. No hero section, no promotions, no search, no personalization.

### What to Add

#### 1A. Hero Section with Promotional Banner

- Display a welcome message with the user's name ("Hello, Somil!")
- Rotating promotional banners / carousel (admin-managed via CMS — see §2)
- "Emergency Service" quick-book button (prominent CTA)
- Background gradient or hero image

**File:** `frontend/user-app/src/pages/services/ServiceCategoriesPage.tsx` (rewrite as `HomePage.tsx`)

#### 1B. Search Bar

- Search input at the top of the home page
- Searches across service category names and sub-service names
- Client-side filter (data already fetched) or new backend search endpoint
- Uses shadcn `Input` with search icon

#### 1C. Alert Headline / Announcement Banner

- Below the TopBar, show a dismissible alert banner for:
  - New offers ("🎉 20% off on AC servicing this week!")
  - Service announcements ("We're now available in your area!")
  - Coupon codes ("Use WELCOME20 for ₹200 off!")
- Content managed by admin via CMS (see §2)
- Stored in localStorage once dismissed (per user)

#### 1D. Quick Access Sections

- "Recent Bookings" — last 2-3 jobs as small cards (already has API: `GET /api/jobs/history`)
- "Your Points" — points balance card (see §3)
- "Available Offers" — active coupons/promotions (see §4)

#### 1E. Location-Aware Content

- Show user's city/area in the TopBar or home page
- Filter services by availability in user's location (future)

### Files to Change

| File | Change |
|------|--------|
| `frontend/user-app/src/pages/services/ServiceCategoriesPage.tsx` | Rewrite as `HomePage.tsx` with hero, search, announcements, quick access |
| `frontend/user-app/src/components/layout/TopBar.tsx` | Add search icon or location display |
| `frontend/user-app/src/App.tsx` | Update route if renamed to HomePage |

---

## 2. Admin Content Management (CMS)

**Current state:** No CMS exists. No banners, announcements, or promotional content can be managed by admin. The Campaign model exists in city-manager but is unrelated to home page content.

### 2A. Backend — New CMS Model + Endpoints

**New model:** `src/modules/admin/models/Banner.ts`

```ts
interface IBanner {
    title: string;           // "20% Off AC Service"
    subtitle?: string;       // "Limited time offer"
    imageUrl?: string;       // hero image URL
    linkUrl?: string;        // deep link (e.g. /services/:id)
    type: 'PROMOTION' | 'ANNOUNCEMENT' | 'COUPON' | 'INFO';
    isActive: boolean;
    sortOrder: number;
    startsAt?: Date;
    expiresAt?: Date;
    createdBy: IUser['_id'];
    createdAt: Date;
    updatedAt: Date;
}
```

**New endpoints** (in admin routes, behind `protect` + `restrictTo(ADMIN)`):

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/api/admin/banners` | `getBanners` | List all banners (admin view, includes inactive) |
| GET | `/api/admin/banners/active` | `getActiveBanners` | Public — returns currently active, non-expired banners |
| POST | `/api/admin/banners` | `createBanner` | Create banner |
| PATCH | `/api/admin/banners/:id` | `updateBanner` | Update banner |
| DELETE | `/api/admin/banners/:id` | `deleteBanner` | Delete banner |

### 2B. Frontend — Admin Banner Management

**New page:** `frontend/admin-dashboard/src/pages/content/BannersPage.tsx`

- Table/card list of all banners
- Create/edit dialog with fields: Title, Subtitle, Image URL, Link URL, Type (select), Active (switch), Sort Order, Start/End dates
- Delete confirmation dialog

**Admin sidebar:** Add "Content" nav item with `Megaphone` icon

**Admin App.tsx:** Add `/content/banners` route

### 2C. Frontend — User Home Page Integration

- Fetch `GET /api/admin/banners/active` (public endpoint)
- Render active banners as a carousel/hero section
- Render announcements as a dismissible alert bar
- Render coupon banners with copy-to-clipboard for codes

### Files to Create/Change

| File | Change |
|------|--------|
| `src/modules/admin/models/Banner.ts` | NEW — Banner model |
| `src/modules/admin/controllers/admin.controller.ts` | Add banner CRUD methods |
| `src/modules/admin/routes/admin.routes.ts` | Add banner routes |
| `frontend/admin-dashboard/src/pages/content/BannersPage.tsx` | NEW — Admin banner management page |
| `frontend/admin-dashboard/src/components/layout/AdminSidebar.tsx` | Add "Content" nav item |
| `frontend/admin-dashboard/src/App.tsx` | Add `/content/banners` route |
| `frontend/user-app/src/pages/services/ServiceCategoriesPage.tsx` | Fetch and display active banners |

---

## 3. Points / Rewards / Loyalty System

**Current state:** No points, rewards, or loyalty system exists anywhere. `CreditStatus` on User is a risk flag (GREEN/RED), not a loyalty program.

### 3A. Backend — Points Model + Logic

**New model:** `src/modules/users/models/UserPoints.ts`

```ts
interface IUserPoints {
    user: IUser['_id'];         // unique ref
    balance: number;            // current redeemable points
    lifetimeEarned: number;     // total ever earned
    lifetimeRedeemed: number;   // total ever redeemed
    createdAt: Date;
    updatedAt: Date;
}

interface IPointTransaction {
    user: IUser['_id'];
    amount: number;             // positive = earned, negative = redeemed
    type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';
    reference: {
        model: 'Job' | 'Coupon' | 'ADMIN';
        id: string;
    };
    description: string;        // "Job #xyz completed", "Redeemed for discount"
    expiresAt?: Date;           // optional expiration
    createdAt: Date;
}
```

**Points rules (configurable by admin later):**

| Event | Points Earned |
|-------|---------------|
| Job completed | 10% of job amount (rounded) |
| First booking bonus | 100 points |
| Referral bonus | 200 points |
| 5-star rating given | 50 points |

**Redemption:** 1 point = ₹1 discount on future bookings.

**New endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/me/points` | Get current balance + recent transactions |
| GET | `/api/users/me/points/history` | Paginated point transaction history |
| POST | `/api/jobs/:id/earn-points` | Internal — called after job completion |

**Integration points:**
- `JobService.completeJob()` → auto-award points
- `JobService.processPayment()` → check if user wants to redeem points, apply discount
- `AuthController.signup()` → award first-booking bonus on first job completion

### 3B. Frontend — Points UI

**User App new pages/sections:**

| File | Description |
|------|-------------|
| `pages/points/PointsPage.tsx` | Balance display, earn/redeem history, how-it-works explainer |
| `pages/points/PointsHistoryPage.tsx` | Paginated list of all point transactions |
| `components/points/PointsBalanceCard.tsx` | Small card showing balance, used in home page and profile |
| `components/points/RedeemToggle.tsx` | Toggle on payment page to apply points as discount |

**BottomNav:** Add Points tab (or add to Profile page)

**PaymentPage.tsx:** Add "Use Points" toggle that applies available balance as discount

**TopBar.tsx or ProfilePage:** Show points balance badge

### 3C. Admin — Points Management

- View all users' point balances
- Manual point adjustment (award/revoke)
- Configure points rules (earn rate, redemption rate)

---

## 4. Coupon / Discount System

**Current state:** A `Campaign` model exists in city-manager (`src/modules/city-manager/models/Campaign.ts`) with `discountPercent` and `discountCode` fields, but it's completely unwired — no validation, no application to bookings, no user-facing UI.

### 4A. Backend — Coupon Model + Endpoints

**Option 1 (recommended):** Create a dedicated `Coupon` model separate from Campaign.

**New model:** `src/modules/admin/models/Coupon.ts`

```ts
interface ICoupon {
    code: string;               // unique, uppercase (e.g. "WELCOME20")
    description: string;        // "20% off first booking"
    type: 'PERCENTAGE' | 'FLAT' | 'FREE_DELIVERY';
    value: number;              // percentage (20) or flat amount (200)
    minOrderAmount?: number;    // minimum job value to apply
    maxDiscount?: number;       // cap for percentage coupons
    usageLimit?: number;        // max total uses (null = unlimited)
    usageCount: number;         // current uses
    perUserLimit?: number;      // max uses per user
    applicableCategories?: string[];  // service category IDs (empty = all)
    isActive: boolean;
    startsAt?: Date;
    expiresAt?: Date;
    createdBy: IUser['_id'];
    createdAt: Date;
    updatedAt: Date;
}
```

**New endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/coupons` | Admin | List all coupons |
| POST | `/api/admin/coupons` | Admin | Create coupon |
| PATCH | `/api/admin/coupons/:id` | Admin | Update coupon |
| DELETE | `/api/admin/coupons/:id` | Admin | Delete coupon |
| POST | `/api/coupons/validate` | User | Validate a coupon code, return discount info |
| POST | `/api/coupons/apply` | User | Apply coupon to a job (called during job creation or payment) |

**Validation logic (`POST /api/coupons/validate`):**

```ts
Input: { code: string, jobAmount: number, categoryId?: string }
Checks:
  - Code exists and isActive
  - Not expired
  - usageCount < usageLimit
  - user hasn't exceeded perUserLimit
  - jobAmount >= minOrderAmount
  - categoryId is in applicableCategories (if restricted)
Output: { valid: boolean, discount: number, type: string, message: string }
```

### 4B. Integration with Job/Payment Flow

**Job model changes** (`src/modules/jobs/models/Job.ts`):
- Add `couponCode?: string`
- Add `discount?: number`

**Job creation** (`JobService.createJob`):
- Accept optional `couponCode` in request body
- Validate coupon before creating job
- Store `couponCode` and calculated `discount` on job

**Payment** (`JobService.processPayment`):
- Subtract `discount` from total before charging
- Mark coupon as used (increment `usageCount`)
- Record coupon usage per user

### 4C. Frontend — User Coupon UI

**PaymentPage.tsx** changes:
- Add "Have a coupon code?" input field
- "Apply" button → calls `POST /api/coupons/validate`
- Show discount amount and updated total
- Remove coupon option

**Home page** (via CMS banners):
- Show active promotions with coupon codes
- Copy-to-clipboard button for coupon codes

### 4D. Frontend — Admin Coupon Management

**New page:** `frontend/admin-dashboard/src/pages/coupons/CouponsPage.tsx`

- Table of all coupons with: Code, Type, Value, Usage (count/limit), Active, Dates, Actions
- Create/edit dialog: Code, Type (select), Value, Min Order, Max Discount, Usage Limit, Per-User Limit, Categories (multi-select), Active, Dates
- Delete confirmation

**Admin sidebar:** Add "Coupons" nav item with `Tag` icon

**Admin App.tsx:** Add `/coupons` route

---

## 5. Dark / Light Mode — All 3 Apps

### Current State (Infrastructure Audit)

| Check | Status |
|-------|--------|
| `tailwind.config.js` → `darkMode: ["class"]` | ✅ All 3 apps |
| `index.css` → `.dark { ... }` CSS variable overrides | ✅ All 3 apps |
| shadcn UI components use CSS variables | ✅ Correct |
| ThemeProvider / ThemeContext | ❌ Missing |
| Theme toggle component | ❌ Missing |
| localStorage persistence | ❌ Missing |
| Flash-free inline script in index.html | ❌ Missing |

### Hardcoded Color Problem (87 files, ~425 occurrences)

| Pattern | admin | user | worker | Total | Fix |
|---------|-------|------|--------|-------|-----|
| `text-gray-500` | 29 | 63 | 51 | **143** | `text-muted-foreground` |
| `text-gray-400` | 6 | 12 | 13 | **31** | `text-muted-foreground` |
| `text-red-500` | 14 | 13 | 15 | **42** | keep or CSS var |
| `bg-red-50` | 6 | 16 | 16 | **38** | `bg-destructive/10` |
| `bg-gray-100` | 3 | 7 | 7 | **17** | `bg-muted` |
| `border-red-200` | 4 | 12 | 12 | **28** | keep or CSS var |
| `text-red-700` | 4 | 12 | 12 | **28** | keep or CSS var |
| `text-green-600` | 10 | 6 | 10 | **26** | keep |
| `bg-gray-50` | 3 | 5 | 2 | **10** | `bg-muted/50` |
| `bg-white` | 2 | 2 | 2 | **6** | `bg-card` |
| `text-blue-500` | 0 | 5 | 5 | **10** | keep |
| **Total** | **~95** | **~175** | **~155** | **~425** | |

### Implementation Plan

#### 5A. ThemeProvider (one per app)

Install `next-themes` in each app:
```bash
npm install next-themes
```

Create `src/components/theme-provider.tsx` in each app wrapping the app with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.

#### 5B. Theme Toggle Component

Create `src/components/theme-toggle.tsx` — a ghost button with Sun/Moon/Monitor icons that cycles system → light → dark.

Place in: TopBar (user/worker), AdminTopBar or AdminSidebar.

#### 5C. Flash-Free Inline Script

Add to each `index.html` `<head>`:
```html
<script>
  (function() {
    const t = localStorage.getItem('theme') || 'system';
    if (t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme:dark)').matches))
      document.documentElement.classList.add('dark');
  })();
</script>
```

#### 5D. Fix Hardcoded Colors

Replace across all ~87 files. Priority order:
1. Neutral grays first (`text-gray-500` → `text-muted-foreground`, `bg-white` → `bg-card`, etc.)
2. Then semantic colors (red/green/amber/blue) — these can stay if they look acceptable in dark mode, or map to CSS variables
3. Fix shared components first (Badge, EmptyState, ErrorBoundary, LoadingSpinner, PageError) — fixes 15 files instantly

---

## 6. shadcn Components Everywhere

### Current State

| App | shadcn Components Installed |
|-----|---------------------------|
| admin-dashboard | badge, button, card, input, skeleton, tabs, textarea, select, dialog, table, switch, label |
| user-app | badge, button, card, input, skeleton, tabs, textarea |
| worker-app | badge, button, card, input, skeleton, tabs, textarea, select, label |

### Components to Install

```bash
# All 3 apps:
npx shadcn@latest add dropdown-menu form avatar separator sheet alert alert-dialog tooltip popover sonner
```

### Custom Components → shadcn Mapping

| Custom Component | shadcn Replacement | Priority |
|-----------------|-------------------|----------|
| Error display (`<div className="bg-red-50...">`) | `Alert` variant="destructive" | High |
| `EmptyState` | `Card` + `Button` pattern | High |
| `ErrorAlert` | `Alert` | Medium |
| `LoadingSpinner` | Keep (it's just a spinner) | — |
| Modal patterns | `Dialog` / `AlertDialog` | High |
| Toast patterns | `Sonner` | Medium |
| User avatar | `Avatar` | Medium |
| Tooltips | `Tooltip` | Low |

### Pages to Refactor

**Admin** (~15 pages): LoginPage, DashboardPage, LiveOpsPage, AnalyticsPage, WorkersListPage, WorkerDetailPage, PendingVerificationPage, ComplaintsListPage, ComplaintDetailPage, DisputesPage, SettingsPage, ServicesListPage, CategoryDetailPage, BannersPage (new), CouponsPage (new)

**User** (~25 pages): LoginPage, RegisterPage, OTPLoginPage, ServiceCategoriesPage, SubServicesPage, ServiceDetailPage, all booking pages, all job pages, ProfilePage, EditProfilePage, NotificationsPage, BookingsHistoryPage, JobDetailPage, WarrantyPages, PointsPage (new)

**Worker** (~20 pages): LoginPage, RegisterPage, OTPLoginPage, DashboardPage, JobRequestsPage, JobDetailPage, ActiveJobPage, all job flow pages, KYCPage, ProfilePage, EditProfilePage, EarningsPage, NotificationsPage

---

## 7. Mobile-First Design Fixes

### Critical Issues

| # | App | Issue | File:Line | Fix |
|---|-----|-------|-----------|-----|
| 1 | User | **No desktop navigation** — BottomNav hides at `md:` with no replacement | `AppLayout.tsx` | Add desktop sidebar or horizontal nav visible at `md:`+ |
| 2 | User | **Login card fixed width** `w-[350px]` overflows on 320px screens | `LoginPage.tsx:48` | Change to `w-full max-w-sm` |
| 3 | All | **No `overflow-x: hidden`** on html/body | `index.css` | Add `html { overflow-x: hidden }` as safety net |
| 4 | Admin | **7-column table on mobile** requires horizontal scroll | `ServicesListPage.tsx:96` | Convert to card layout on mobile (like `WorkersListPage.tsx`) |
| 5 | Admin | **7-column table** in CategoryDetailPage | `CategoryDetailPage.tsx` | Same card layout fix |

### Mobile-First Design Principles to Apply

| Principle | Current Status | Action |
|-----------|---------------|--------|
| Touch targets ≥ 44px | ✅ Mostly good (buttons use `h-10` / `p-2.5`) | Verify all interactive elements |
| Full-width CTAs on mobile | ✅ All form buttons use `w-full` | None needed |
| No horizontal scroll | ❌ Login page + admin tables | Fix listed above |
| Bottom nav on mobile | ✅ User app has BottomNav | None needed |
| Sidebar hamburger on mobile | ✅ Worker + Admin have hamburger menus | None needed |
| Responsive grids | ✅ All use `grid-cols-N md:grid-cols-M` | None needed |
| Forms stack vertically | ✅ All use `space-y-*` vertical stacking | None needed |
| Adequate padding | ✅ All use `p-4` mobile padding | None needed |

### Desktop Navigation for User App

The user app has no desktop navigation. Options:

**Option A: Desktop Sidebar** (like worker/admin apps)
- Add `md:hidden` to BottomNav
- Add a sidebar visible at `md:` with: Home, Bookings, Points, Notifications, Profile, Logout
- Add `md:ml-64` to main content

**Option B: Desktop Horizontal Nav**
- Show a horizontal nav bar below TopBar at `md:`+
- Simpler implementation, good for limited nav items

**Recommended:** Option A (sidebar) for consistency with other apps.

---

## 8. Execution Order & Dependencies

### Phase Group A: Content & Features (no UI framework dependency)

| Phase | What | Depends On | Effort |
|-------|------|------------|--------|
| A1 | Admin CMS — Banner model + endpoints + admin UI | — | 1.5h |
| A2 | User home page — hero, search, banner display | A1 | 1.5h |
| A3 | Coupon system — model + endpoints + admin UI | — | 1.5h |
| A4 | Coupon integration — job/payment flow + user UI | A3 | 1h |
| A5 | Points system — model + endpoints + earn/redeem logic | — | 2h |
| A6 | Points UI — balance card, history page, payment integration | A5 | 1.5h |

### Phase Group B: UI Framework (shadcn first, then dark mode)

| Phase | What | Depends On | Effort |
|-------|------|------------|--------|
| B1 | Install missing shadcn components (all 3 apps) | — | 10 min |
| B2 | Fix shared components (Badge, EmptyState, etc.) | B1 | 30 min |
| B3 | Refactor admin pages to shadcn | B1, B2 | 1h |
| B4 | Refactor user-app pages to shadcn | B1, B2 | 1.5h |
| B5 | Refactor worker-app pages to shadcn | B1, B2 | 1.5h |
| B6 | Dark mode — ThemeProvider + toggle (all 3 apps) | — | 30 min |
| B7 | Dark mode — fix hardcoded colors (all 87 files) | B2-B5, B6 | 3h |

### Why shadcn BEFORE dark mode:

1. **shadcn components already use CSS variables** — once pages use shadcn primitives, dark mode "just works" for those elements
2. **Shared components (Badge, ErrorAlert, etc.) need fixing anyway** — fixing them with shadcn patterns means they automatically get dark mode support
3. **Dark mode color audit is easier after shadcn refactor** — fewer hardcoded colors to fix because shadcn components handle their own theming
4. **If dark mode comes first**, you fix ~425 hardcoded colors manually, then shadcn refactor replaces many of them again — wasted effort

**Order: B1 → B2 → B3/B4/B5 (parallel) → B6 → B7**

### Phase Group C: Mobile-First Fixes

| Phase | What | Depends On | Effort |
|-------|------|------------|--------|
| C1 | User app — add desktop sidebar navigation | — | 1h |
| C2 | Fix login page width (`w-[350px]` → `w-full max-w-sm`) | — | 5 min |
| C3 | Admin tables → card layout on mobile | B3 | 30 min |
| C4 | Add `overflow-x: hidden` to all apps | — | 5 min |

### Recommended Overall Order

```
Phase A1-A2 (CMS + Home Page)     ─┐
Phase A3-A4 (Coupons)              ├─ can run in parallel
Phase A5-A6 (Points)              ─┘
Phase B1-B2 (shadcn install + shared)
Phase B3-B5 (shadcn refactor per app)
Phase B6-B7 (dark mode infra + color fix)
Phase C1-C4 (mobile-first fixes)
```

---

## 9. Notes & Tech Debt

- The `Admin` model (`src/modules/admin/admin.model.ts`) exists but is never used — the auth system uses the `User` model with `role: ADMIN`. Consider removing.
- The signup endpoint has no role restriction — anyone can self-register as ADMIN. Add role validation.
- All 3 frontend apps duplicate types, components, and utilities. Consider a shared `packages/` directory with a monorepo tool (turborepo/nx).
- The Campaign model (`src/modules/city-manager/models/Campaign.ts`) overlaps with the proposed Coupon system. Either extend Campaign to be the coupon system, or create a separate Coupon model and deprecate Campaign's discount fields.
- `GET /api/jobs/history` has no pagination — returns ALL jobs. Add pagination for users with many bookings.
- The user-app has no desktop navigation — desktop users can only navigate via browser URL bar. This is a critical UX gap.
- Consider adding `react-helmet` or similar for per-page `<title>` management across all 3 apps.
