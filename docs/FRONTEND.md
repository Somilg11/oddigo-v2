# Frontend Implementation Plan - Oddigo v2

Complete phase-wise frontend implementation guide covering all three apps: Customer App, Worker App, and Admin Dashboard.

---

## Current State Assessment

### What Exists
| App | Status | Pages | Components | API Client | Auth Store |
|-----|--------|-------|------------|------------|------------|
| user-app | Scaffolded (partial) | Login, Register, Home | button, card, input | ✅ (wrong base URL) | ✅ |
| worker-app | Scaffolded (partial) | Login, Register, Dashboard | button, card, input | ✅ (wrong base URL) | ✅ |
| admin-dashboard | **Empty (Vite boilerplate)** | None | None | None | None |

### Critical Issues to Fix First
1. **API Base URL Mismatch**: Frontend uses `/api/v1/auth/login/user` but backend has `/api/auth/login`
2. **No Environment Variables**: Base URL `http://localhost:3000/api/v1` hardcoded
3. **localStorage Key Inconsistency**: Zustand persist key vs api.ts interceptor key mismatch
4. **Missing Types**: No TypeScript interfaces for API responses
5. **No Shared Code**: Each app duplicates components, utils, types
6. **No Error Boundaries**: `alert()` used for error handling
7. **No Loading States**: No skeleton/spinner components
8. **Unused Boilerplate**: `App.css` with Vite logo spin animation

### Tech Stack (Per App)
- React 19.2 + TypeScript 5.9
- Vite 7.2
- React Router DOM 7.9
- Zustand 5.0 (state management)
- Axios 1.13 (HTTP client)
- React Hook Form 7.67 + Zod 4.1 (form validation)
- Tailwind CSS 3.4 + shadcn/ui
- Lucide React (icons)

---

## Backend API Reference

All endpoints are prefixed with `/api`. Full docs in `docs/API.md`.

### Auth
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/auth/signup` | `{name, email, phone, password, role}` |
| POST | `/api/auth/login` | `{email, password}` |
| POST | `/api/auth/request-otp` | `{email}` |
| POST | `/api/auth/verify-otp` | `{email, code}` |

### Services
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/services/categories` | Public |
| GET | `/api/services/sub-services?categoryId=` | Public |

### Jobs (Protected)
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/jobs` | `{serviceType, subService, location, photos, videos}` |
| POST | `/api/jobs/estimate` | `{serviceType, lat, long, subServiceId}` |
| GET | `/api/jobs/:id` | - |
| GET | `/api/jobs/history` | - |
| POST | `/api/jobs/:id/find-workers` | - |
| POST | `/api/jobs/:id/accept` | Worker accepts |
| PATCH | `/api/jobs/:id/start` | Worker starts |
| POST | `/api/jobs/:id/request-otp` | Worker requests OTP |
| POST | `/api/jobs/:id/verify-otp` | `{otp}` |
| POST | `/api/jobs/:id/estimate` | `{visitCharge, labourCost, partsCost}` |
| PATCH | `/api/jobs/:id/final-approval` | `{approved}` |
| POST | `/api/jobs/:id/before-photo` | `{photoUrl}` |
| POST | `/api/jobs/:id/after-photo` | `{photoUrl}` |
| POST | `/api/jobs/:id/complete` | `{proofUrl, customerSignature}` |
| POST | `/api/jobs/:id/amendment` | `{reason, proposedAmount, evidenceUrl}` |
| PATCH | `/api/jobs/:id/amendment` | `{approved}` |
| POST | `/api/jobs/:id/pay` | `{paymentMethod}` |
| POST | `/api/jobs/:id/refund` | `{reason}` |
| POST | `/api/jobs/:id/signature` | `{signatureData}` |

### Ratings
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/ratings/jobs/:id/rate` | `{rating, review}` |
| GET | `/api/ratings/workers/:id/ratings` | Query: page, limit |

### Warranty
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/warranty/:jobId/claim` | `{description, photos}` |
| GET | `/api/warranty/:jobId/status` | - |

### Workers (Protected, Worker role)
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/workers/me` | - |
| POST | `/api/workers/onboarding` | `{skills}` |
| POST | `/api/workers/availability` | `{isOnline, location}` |
| GET | `/api/workers/stats` | - |
| POST | `/api/workers/kyc/upload` | `{documentType, documentUrl}` |
| GET | `/api/workers/kyc` | - |

### Notifications (Protected)
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/notifications` | Last 50 |
| PATCH | `/api/notifications/:id/read` | Mark read |

### Field Executive (Protected, FIELD_EXECUTIVE role)
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/field-executive/workers` | - |
| GET | `/api/field-executive/worker/:id/status` | - |
| POST | `/api/field-executive/worker/:id/visit` | `{type, notes, photos}` |
| GET | `/api/field-executive/quality-audit` | Query: page, limit |
| POST | `/api/field-executive/quality-audit/:jobId` | `{hasBeforePhotos, hasAfterPhotos, invoiceValid}` |

### Zone Manager (Protected, ZONE_MANAGER role)
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/zone-manager/zones` | - |
| GET | `/api/zone-manager/zones/:id/stats` | - |
| GET | `/api/zone-manager/zones/:id/supply-demand` | - |
| POST | `/api/zone-manager/zones/:id/recruit` | `{skillNeeded, countNeeded, reason}` |

### City Manager (Protected, CITY_MANAGER role)
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/city-manager/dashboard` | - |
| GET | `/api/city-manager/zones` | - |
| POST | `/api/city-manager/zones` | `{name, city, center, radiusKm}` |
| POST | `/api/city-manager/categories` | `{name, slug, icon}` |
| POST | `/api/city-manager/campaigns` | `{name, city, discountPercent, ...}` |

### Admin (Protected, ADMIN role)
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/admin/health` | - |
| GET | `/api/admin/analytics` | - |
| GET | `/api/admin/operations/live` | - |
| GET | `/api/admin/disputes` | - |
| POST | `/api/admin/maintenance` | `{app, enabled}` |
| POST | `/api/admin/verify-worker` | `{workerId, status}` |
| PATCH | `/api/admin/users/status` | `{userId, isActive}` |
| GET | `/api/admin/complaints` | Query: status, page, limit |
| POST | `/api/admin/complaints/:id/resolve` | `{resolution, refundAmount}` |
| GET | `/api/admin/workers/pending-verification` | Query: page, limit |
| POST | `/api/admin/workers/bulk-verify` | `{documentIds, status}` |

---

## Shared Foundation (Phase 0)

Before building any app, establish a shared foundation. Since these are 3 separate Vite apps (not a monorepo), shared code is duplicated per app. However, we define the patterns once here.

### 0.1 Environment Variables

Each app needs `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

### 0.2 TypeScript Types (`src/types/`)

Every app needs a `types/` directory with shared interfaces:

```
src/types/
  api.ts          # API response wrapper type
  auth.ts         # User, Worker, LoginResponse, SignupResponse
  services.ts     # ServiceCategory, SubService
  jobs.ts         # Job, JobStatus, Estimate, Amendment
  workers.ts      # WorkerProfile, KYC document
  ratings.ts      # Rating, RatingSummary
  warranty.ts     # Warranty, WarrantyClaim
  notifications.ts # Notification
  admin.ts        # Analytics, LiveOperations, Complaint
```

### 0.3 API Client (`src/lib/api.ts`)

```ts
// Production pattern for all apps:
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: read token from Zustand store
// Response interceptor: on 401, logout + redirect to /login
// Response interceptor: unwrap { success, data } envelope
```

### 0.4 Auth Store Pattern (`src/store/auth.store.ts`)

```ts
// Zustand persist store with:
// - user/worker object
// - accessToken
// - refreshToken
// - setAuth(), logout(), updateProfile()
// Persisted to localStorage with app-specific key
```

### 0.5 Shared UI Components

Install per app (shadcn/ui):
- `button`, `card`, `input`, `badge`, `dialog`, `dropdown-menu`
- `select`, `textarea`, `label`, `separator`, `avatar`
- `toast` / `sonner` (notifications)
- `skeleton` (loading states)
- `tabs`, `table`, `pagination`
- `form` (react-hook-form integration)
- `sheet` (mobile sidebar)
- `scroll-area`, `tooltip`

---

## Phase 1: Foundation & Auth (All Apps)

**Goal**: Working login/register for all 3 apps with correct backend integration.

### 1.1 Fix API URL Mismatch

**user-app** `src/lib/api.ts`:
- Change `baseURL` from `http://localhost:3000/api/v1` to `import.meta.env.VITE_API_BASE_URL`
- Add `.env` with `VITE_API_BASE_URL=http://localhost:3000/api`

**worker-app** `src/lib/api.ts`:
- Same fix as user-app

**admin-dashboard** `src/lib/api.ts`:
- Create new file with same pattern

### 1.2 Fix Auth Endpoints

| App | Current (Wrong) | Correct |
|-----|-----------------|---------|
| user-app | `POST /auth/login/user` | `POST /auth/login` |
| user-app | `POST /auth/register/user` | `POST /auth/signup` |
| worker-app | `POST /auth/login/worker` | `POST /auth/login` |
| worker-app | `POST /auth/register/worker` | `POST /auth/signup` (with `role: "WORKER"`) |

### 1.3 Fix localStorage Key Consistency

The Zustand persist middleware and api.ts interceptor must use the same key.

**user-app**: Use `localStorage.getItem('user-access-token')` in api.ts, match with Zustand persist name.

**worker-app**: Use `localStorage.getItem('worker-access-token')` in api.ts, match with Zustand persist name.

**admin-dashboard**: Use `localStorage.getItem('admin-access-token')`.

### 1.4 Create Types Files

Each app needs `src/types/index.ts` with all shared interfaces matching the backend models.

### 1.5 Pages for Phase 1

#### User App
| Page | Route | Description |
|------|-------|-------------|
| LoginPage | `/login` | Email + password login |
| RegisterPage | `/register` | Name, email, phone, password signup |
| OTPLoginPage | `/login/otp` | Request OTP → verify OTP flow |
| HomePage | `/` | Service categories, recent jobs |

#### Worker App
| Page | Route | Description |
|------|-------|-------------|
| LoginPage | `/login` | Email + password login |
| RegisterPage | `/register` | Full registration with skills |
| OTPLoginPage | `/login/otp` | OTP-based login |
| DashboardPage | `/` | Stats, availability toggle, active job |

#### Admin Dashboard
| Page | Route | Description |
|------|-------|-------------|
| LoginPage | `/login` | Admin email + password login |
| DashboardPage | `/` | Analytics overview (after auth) |

### 1.6 Build & Verify
- Run `npm run build` in each app
- Verify TypeScript compiles with no errors
- Test login/register flows against running backend

---

## Phase 2: Customer App - Service Booking Flow

**Goal**: Complete 14-step booking flow in the customer app.

### 2.1 Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| `AppLayout` | `src/components/layout/AppLayout.tsx` | Top nav + bottom tab bar + main content area |
| `BottomNav` | `src/components/layout/BottomNav.tsx` | Home, Bookings, Notifications, Profile |
| `TopBar` | `src/components/layout/TopBar.tsx` | Logo, notification bell, profile avatar |

### 2.2 Service Selection Pages

| Page | Route | Description |
|------|-------|-------------|
| ServiceCategoriesPage | `/services` | Grid of 4 categories (Plumbing, Electrical, AC, Vehicle) |
| SubServicesPage | `/services/:categoryId` | List of sub-services within category |
| ServiceDetailPage | `/services/sub/:subServiceId` | Service description, basePrice, estimated time, "Book Now" |

**API Calls:**
- `GET /api/services/categories`
- `GET /api/services/sub-services?categoryId=:id`
- `GET /api/services/sub-services/:id`

### 2.3 Issue Upload Page

| Page | Route | Description |
|------|-------|-------------|
| IssueUploadPage | `/booking/issue` | Upload photos (min 1), videos (min 1), voice note, custom issue text |

**Implementation:**
- File upload to Cloudinary via direct upload (frontend → Cloudinary API)
- Store URLs in state, pass to job creation
- Voice recording via MediaRecorder API

### 2.4 AI Analysis Display

| Page | Route | Description |
|------|-------|-------------|
| AIDisplayPage | `/booking/ai-analysis` | Shows AI analysis results (problem type, causes, cost range) |

**API Call:** Results come from job creation response or separate call.

### 2.5 Worker Matching & Selection

| Page | Route | Description |
|------|-------|-------------|
| WorkerMatchingPage | `/booking/matching` | Loading animation while matching |
| WorkerSelectionPage | `/booking/workers` | List of matched workers with ratings, distance |

**API Calls:**
- `POST /api/jobs/:id/find-workers`

### 2.6 Job Confirmation

| Page | Route | Description |
|------|-------|-------------|
| JobConfirmationPage | `/booking/confirm` | Worker profile, rating, ETA, cost estimate, Approve/Reject |

### 2.7 Active Job Tracking

| Page | Route | Description |
|------|-------|-------------|
| ActiveJobPage | `/job/:id` | Live tracking map, worker location, status timeline |
| OTPDisplayPage | `/job/:id/otp` | Shows OTP to share with worker |
| EstimateApprovalPage | `/job/:id/approve-estimate` | Worker's cost breakdown, approve/reject |
| DigitalSignaturePage | `/job/:id/signature` | Canvas for digital signature |
| PaymentPage | `/job/:id/pay` | Payment method selection (UPI, Card, Cash) |
| RatingPage | `/job/:id/rate` | Star rating + review text |

### 2.8 History & Profile Pages

| Page | Route | Description |
|------|-------|-------------|
| BookingsHistoryPage | `/bookings` | List of past jobs with status |
| JobDetailPage | `/bookings/:id` | Full job details, warranty status |
| ProfilePage | `/profile` | User info, addresses, settings |
| EditProfilePage | `/profile/edit` | Edit name, email, phone, avatar |
| AddressesPage | `/profile/addresses` | Manage saved addresses |
| NotificationsPage | `/notifications` | Notification list with read/unread |

### 2.9 Warranty Pages

| Page | Route | Description |
|------|-------|-------------|
| WarrantyStatusPage | `/warranty/:jobId` | Warranty status, days remaining |
| WarrantyClaimPage | `/warranty/:jobId/claim` | File claim with description + photos |

---

## Phase 3: Worker App - Job Management

**Goal**: Worker can receive jobs, manage OTP, upload photos, complete jobs.

### 3.1 Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| `WorkerLayout` | `src/components/layout/WorkerLayout.tsx` | Sidebar + top bar + content |
| `WorkerSidebar` | `src/components/layout/WorkerSidebar.tsx` | Dashboard, Jobs, KYC, Profile |
| `WorkerTopBar` | `src/components/layout/WorkerTopBar.tsx` | Online/offline toggle, notifications |

### 3.2 Dashboard

| Page | Route | Description |
|------|-------|-------------|
| DashboardPage | `/` | Today's stats (completed, earnings), online toggle, active job card |

**API Calls:**
- `GET /api/workers/stats`
- `POST /api/workers/availability`

### 3.3 Job Request Flow

| Page | Route | Description |
|------|-------|-------------|
| JobRequestsPage | `/jobs/requests` | Incoming job offers with accept/reject |
| JobDetailPage | `/jobs/:id` | Full job details, customer info, AI analysis |
| ActiveJobPage | `/jobs/:id/active` | Current job workflow (OTP → Estimate → Repair → Complete) |

### 3.4 Job Workflow Pages

| Page | Route | Description |
|------|-------|-------------|
| OTPRequestPage | `/jobs/:id/otp-request` | Button to request OTP from customer |
| OTPEntryPage | `/jobs/:id/otp-verify` | Enter OTP received from customer |
| EstimateFormPage | `/jobs/:id/estimate` | Form: visitCharge, labourCost, partsCost, notes |
| BeforePhotoPage | `/jobs/:id/before-photo` | Camera/upload for before photo |
| AfterPhotoPage | `/jobs/:id/after-photo` | Camera/upload for after photo |
| CompleteJobPage | `/jobs/:id/complete` | Final proof upload + submit |

### 3.5 KYC & Profile

| Page | Route | Description |
|------|-------|-------------|
| KYCPage | `/kyc` | Upload Aadhaar, PAN, Bank Details, view status |
| KYCUploadPage | `/kyc/upload/:docType` | Upload specific document |
| ProfilePage | `/profile` | Worker profile, skills, stats |
| EditProfilePage | `/profile/edit` | Edit skills, personal info |
| EarningsPage | `/earnings` | Earnings history, total completed |

### 3.6 Job History

| Page | Route | Description |
|------|-------|-------------|
| JobHistoryPage | `/jobs/history` | Past jobs with status, earnings |
| JobDetailPage | `/jobs/history/:id` | Full job details, customer rating |

---

## Phase 4: Admin Dashboard

**Goal**: Full admin panel with operations monitoring, worker management, complaints.

### 4.1 Foundation Setup

Create from scratch:
- `src/lib/api.ts` - API client
- `src/store/auth.store.ts` - Admin auth store
- `src/types/index.ts` - TypeScript types
- `src/App.tsx` - Router with auth
- `src/components/layout/AdminLayout.tsx` - Sidebar layout

### 4.2 Layout

| Component | File | Purpose |
|-----------|------|---------|
| `AdminLayout` | `src/components/layout/AdminLayout.tsx` | Sidebar + top bar + content area |
| `AdminSidebar` | `src/components/layout/AdminSidebar.tsx` | Dashboard, Workers, Complaints, Settings |
| `AdminTopBar` | `src/components/layout/AdminTopBar.tsx` | Admin name, notifications, settings |

### 4.3 Pages

| Page | Route | Description |
|------|-------|-------------|
| LoginPage | `/login` | Admin email + password |
| DashboardPage | `/` | Overview cards: total users, jobs, GMV, active workers |
| LiveOpsPage | `/operations/live` | Real-time: pending requests, workers online/busy/offline |
| AnalyticsPage | `/analytics` | Charts: revenue, jobs, ratings, cancellation % |
| WorkersListPage | `/workers` | All workers with status, rating, verification |
| WorkerDetailPage | `/workers/:id` | Worker profile, jobs, KYC status |
| PendingVerificationPage | `/workers/verification` | KYC documents awaiting review |
| ComplaintsListPage | `/complaints` | All complaints with filters (OPEN, ESCALATED, etc.) |
| ComplaintDetailPage | `/complaints/:id` | Complaint details, resolution form |
| DisputesPage | `/disputes` | Cancelled/charged jobs |
| MaintenancePage | `/settings/maintenance` | Toggle maintenance mode for apps |
| SettingsPage | `/settings` | System health, providers status |

### 4.4 Real-Time Features

| Feature | Implementation |
|---------|---------------|
| Live operations count | Poll `GET /api/admin/operations/live` every 30s |
| Worker verification queue | Poll `GET /api/admin/workers/pending-verification` every 60s |
| Complaint feed | Poll `GET /api/admin/complaints` every 60s |
| System health | Call `GET /api/admin/health` on load |

---

## Phase 5: Shared Components & Polish

**Goal**: Extract common patterns, add loading states, error handling, responsive design.

### 5.1 Common Components (Per App)

| Component | Purpose |
|-----------|---------|
| `LoadingSpinner` | Full-page loading indicator |
| `SkeletonCard` | Skeleton loading for cards |
| `EmptyState` | "No data" placeholder with icon |
| `ErrorAlert` | Error message display |
| `StatusBadge` | Colored badge for job/status states |
| `ConfirmDialog` | Confirmation modal |
| `FileUpload` | Drag-and-drop file upload component |
| `StarRating` | Interactive star rating display/input |
| `PriceDisplay` | Formatted price with currency symbol |
| `TimeAgo` | Relative time display ("2 hours ago") |
| `StatusTimeline` | Vertical timeline for job progress |

### 5.2 Form Components

| Component | Purpose |
|-----------|---------|
| `LoginForm` | Email + password with validation |
| `OTPForm` | 6-digit OTP input with auto-submit |
| `SignupForm` | Full registration form |
| `EstimateForm` | Worker cost estimate form |
| `AddressForm` | Address input with coordinates |
| `RatingForm` | Star rating + review textarea |

### 5.3 Error Handling Pattern

```tsx
// Consistent error handling across all API calls
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
        const response = await api.post('/endpoint', data);
        // Success
    } catch (err: any) {
        setError(err.response?.data?.message || 'Something went wrong');
    } finally {
        setLoading(false);
    }
};
```

### 5.4 Loading States

Every data-fetching page must show:
1. Skeleton loading while data loads
2. Empty state if no data
3. Error state if request fails
4. Normal content when data arrives

### 5.5 Responsive Design

- **Mobile-first** approach (all apps are primarily mobile)
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- Bottom tab navigation on mobile (user & worker apps)
- Sidebar navigation on desktop (admin dashboard)

---

## Phase 6: WebSocket Integration

**Goal**: Real-time updates across all apps.

### 6.1 WebSocket Client

```ts
// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
    socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
        auth: { token: `Bearer ${token}` }
    });
    return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => socket?.disconnect();
```

### 6.2 User App Socket Events

| Event | Handler |
|-------|---------|
| `job:accepted` | Navigate to active job page |
| `job:otp` | Show OTP to customer |
| `job:estimate` | Show estimate for approval |
| `job:price-approved` | Show worker starting repair |
| `job:scope-creep-request` | Show amendment for approval |
| `job:warranty-issued` | Show warranty confirmation |
| `live-tracking` | Update worker location on map |

### 6.3 Worker App Socket Events

| Event | Handler |
|-------|---------|
| `job:offer` | Show incoming job notification |
| `job:resume` | Resume after amendment approved |
| `job:rejected` | Show amendment rejected |

### 6.4 Worker Location Updates

```ts
// Worker sends location every 30 seconds
navigator.geolocation.watchPosition((pos) => {
    socket.emit('update-location', {
        lat: pos.coords.latitude,
        long: pos.coords.longitude,
        jobId: currentJobId
    });
});
```

---

## Phase 7: Advanced Features

**Goal**: Media upload, payment, digital signature, push notifications.

### 7.1 Cloudinary Direct Upload

```ts
// Upload directly from frontend to Cloudinary
const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'oddigo_unsigned');
    formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: formData }
    );
    const data = await response.json();
    return data.secure_url;
};
```

### 7.2 Camera Integration

- Use `navigator.mediaDevices.getUserMedia` for camera access
- Capture photo → upload to Cloudinary → pass URL to API
- Before/after photo comparison UI

### 7.3 Digital Signature

- Use canvas-based signature library (e.g., `signature_pad`)
- Convert to base64 → send to `POST /api/jobs/:id/signature`

### 7.4 Payment Integration

- Stripe Elements for card input (if using Stripe)
- UPI intent flow (generate UPI URL, open in app)
- Cash payment: just mark as paid

### 7.5 Push Notifications (Future)

- Service Worker registration
- FCM token management
- Push notification handlers

---

## Phase 8: Testing & Optimization

**Goal**: Production-ready, tested, optimized.

### 8.1 Testing

| Type | Tool | Scope |
|------|------|-------|
| Unit Tests | Vitest | Utility functions, formatters |
| Component Tests | React Testing Library | Form components, UI components |
| E2E Tests | Playwright | Critical flows (login, booking, payment) |

### 8.2 Performance Optimization

- Code splitting per route (`React.lazy`)
- Image optimization (WebP, responsive sizes)
- Bundle analysis (`vite-bundle-analyzer`)
- Lighthouse score > 90

### 8.3 Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Screen reader testing

---

## File Structure Reference

### User App (Final)
```
src/
  main.tsx
  App.tsx
  index.css
  lib/
    api.ts
    utils.ts
    socket.ts
    cloudinary.ts
  store/
    auth.store.ts
    job.store.ts
    notification.store.ts
  types/
    index.ts
    auth.ts
    services.ts
    jobs.ts
    workers.ts
    ratings.ts
    warranty.ts
    notifications.ts
  components/
    layout/
      AppLayout.tsx
      BottomNav.tsx
      TopBar.tsx
    common/
      LoadingSpinner.tsx
      SkeletonCard.tsx
      EmptyState.tsx
      ErrorAlert.tsx
      StatusBadge.tsx
      ConfirmDialog.tsx
      FileUpload.tsx
      StarRating.tsx
      PriceDisplay.tsx
      StatusTimeline.tsx
    forms/
      LoginForm.tsx
      OTPForm.tsx
      SignupForm.tsx
      AddressForm.tsx
      RatingForm.tsx
    ui/ (shadcn)
      button.tsx
      card.tsx
      input.tsx
      badge.tsx
      dialog.tsx
      select.tsx
      textarea.tsx
      label.tsx
      separator.tsx
      avatar.tsx
      skeleton.tsx
      tabs.tsx
      toast.tsx
  pages/
    auth/
      LoginPage.tsx
      RegisterPage.tsx
      OTPLoginPage.tsx
    home/
      HomePage.tsx
    services/
      ServiceCategoriesPage.tsx
      SubServicesPage.tsx
      ServiceDetailPage.tsx
    booking/
      IssueUploadPage.tsx
      AIDisplayPage.tsx
      WorkerMatchingPage.tsx
      WorkerSelectionPage.tsx
      JobConfirmationPage.tsx
    job/
      ActiveJobPage.tsx
      OTPDisplayPage.tsx
      EstimateApprovalPage.tsx
      DigitalSignaturePage.tsx
      PaymentPage.tsx
      RatingPage.tsx
    bookings/
      BookingsHistoryPage.tsx
      JobDetailPage.tsx
    warranty/
      WarrantyStatusPage.tsx
      WarrantyClaimPage.tsx
    profile/
      ProfilePage.tsx
      EditProfilePage.tsx
      AddressesPage.tsx
    notifications/
      NotificationsPage.tsx
```

### Worker App (Final)
```
src/
  main.tsx
  App.tsx
  index.css
  lib/
    api.ts
    utils.ts
    socket.ts
    cloudinary.ts
  store/
    auth.store.ts
    job.store.ts
  types/
    index.ts
  components/
    layout/
      WorkerLayout.tsx
      WorkerSidebar.tsx
      WorkerTopBar.tsx
    common/ (same as user-app)
    forms/
      LoginForm.tsx
      OTPForm.tsx
      SignupForm.tsx
      EstimateForm.tsx
    ui/ (shadcn)
  pages/
    auth/
      LoginPage.tsx
      RegisterPage.tsx
      OTPLoginPage.tsx
    dashboard/
      DashboardPage.tsx
    jobs/
      JobRequestsPage.tsx
      JobDetailPage.tsx
      ActiveJobPage.tsx
      OTPRequestPage.tsx
      OTPEntryPage.tsx
      EstimateFormPage.tsx
      BeforePhotoPage.tsx
      AfterPhotoPage.tsx
      CompleteJobPage.tsx
      JobHistoryPage.tsx
    kyc/
      KYCPage.tsx
      KYCUploadPage.tsx
    profile/
      ProfilePage.tsx
      EditProfilePage.tsx
      EarningsPage.tsx
```

### Admin Dashboard (Final)
```
src/
  main.tsx
  App.tsx
  index.css
  lib/
    api.ts
    utils.ts
  store/
    auth.store.ts
  types/
    index.ts
  components/
    layout/
      AdminLayout.tsx
      AdminSidebar.tsx
      AdminTopBar.tsx
    common/ (same as user-app)
    charts/
      RevenueChart.tsx
      JobsChart.tsx
      RatingsChart.tsx
    ui/ (shadcn)
  pages/
    auth/
      LoginPage.tsx
    dashboard/
      DashboardPage.tsx
    operations/
      LiveOpsPage.tsx
      AnalyticsPage.tsx
    workers/
      WorkersListPage.tsx
      WorkerDetailPage.tsx
      PendingVerificationPage.tsx
    complaints/
      ComplaintsListPage.tsx
      ComplaintDetailPage.tsx
    disputes/
      DisputesPage.tsx
    settings/
      MaintenancePage.tsx
      SettingsPage.tsx
```

---

## Implementation Order

| Phase | Scope | Est. Files | Priority |
|-------|-------|------------|----------|
| 0 | Shared foundation (types, api client, env vars) | 15 | CRITICAL |
| 1 | Auth for all 3 apps (login, register, OTP) | 12 | CRITICAL |
| 2 | Customer booking flow (14 steps) | 20 | HIGH |
| 3 | Worker job management | 15 | HIGH |
| 4 | Admin dashboard | 12 | MEDIUM |
| 5 | Shared components & polish | 15 | MEDIUM |
| 6 | WebSocket integration | 5 | MEDIUM |
| 7 | Advanced (media, payment, signature) | 8 | LOW |
| 8 | Testing & optimization | 10 | LOW |

**Total estimated files: ~112**

---

## Development Commands

```bash
# User App
cd frontend/user-app
npm run dev          # Start dev server (default: http://localhost:5173)
npm run build        # Build for production
npm run lint         # ESLint check

# Worker App
cd frontend/worker-app
npm run dev          # Start dev server (default: http://localhost:5174)
npm run build

# Admin Dashboard
cd frontend/admin-dashboard
npm run dev          # Start dev server (default: http://localhost:5175)
npm run build
```

To run all three simultaneously:
```bash
# Terminal 1
cd frontend/user-app && npm run dev

# Terminal 2
cd frontend/worker-app && npm run dev

# Terminal 3
cd frontend/admin-dashboard && npm run dev
```
