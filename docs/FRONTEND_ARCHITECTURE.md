# Frontend Architecture - Oddigo v2

Shared patterns, utilities, and component architecture across all three frontend apps.

---

## Project Structure

Each app follows the same structure:
```
src/
  main.tsx              # Entry point with ErrorBoundary
  App.tsx               # Router with ProtectedRoute
  index.css             # Tailwind CSS imports
  lib/
    api.ts              # Axios client with interceptors
    api-helpers.ts      # extractData, extractList, extractPaginated
    logger.ts           # Production-safe logger (dev-only console)
    socket.ts           # Socket.io client setup
    cloudinary.ts       # Cloudinary direct upload (user-app, worker-app)
    utils.ts            # cn() utility for Tailwind class merging
  store/
    auth.store.ts       # Zustand persist store for auth state
    job.store.ts        # Job booking state (user-app only)
  types/
    index.ts            # All TypeScript interfaces
  hooks/
    useSocket.ts        # Socket event hooks (user-app, worker-app)
  components/
    layout/             # AppLayout, Sidebar, TopBar, BottomNav
    common/             # LoadingSpinner, EmptyState, ErrorBoundary, PageError, Badge
    ui/                 # shadcn/ui components
  pages/
    auth/               # Login, Register, OTPLogin
    ...feature dirs     # Feature-specific pages
```

---

## Core Utilities

### API Client (`src/lib/api.ts`)
- Axios instance with `VITE_API_BASE_URL` from environment
- Request interceptor attaches Bearer token from localStorage
- Response interceptor: 401 → clear auth + redirect to `/login`
- Structured error logging via logger utility

### API Helpers (`src/lib/api-helpers.ts`)
```ts
// Safe data extraction with null guards
extractData<T>(response)     // Returns T, throws if data missing
extractList<T>(response)     // Returns T[] from { items } or array
extractPaginated<T>(response) // Returns paginated result with defaults
```

### Logger (`src/lib/logger.ts`)
```ts
// Dev-only logging, no-op in production builds
logger.error(...)  // Only in development
logger.warn(...)
logger.info(...)
logger.debug(...)
```

### Socket (`src/lib/socket.ts`)
- Connects to `VITE_API_BASE_URL` with auth token
- Auto-reconnection with 10 attempts
- WebSocket transport preferred, polling fallback

---

## State Management

### Auth Store (Zustand + Persist)
Each app uses its own Zustand persist store:
- **user-app**: `oddigo_user_auth` persist key, `oddigo_token` localStorage key
- **worker-app**: `oddigo_worker_auth` persist key, `oddigo_worker_token` localStorage key
- **admin-dashboard**: `oddigo_admin_auth` persist key, `oddigo_admin_token` localStorage key

Actions: `setAuth(user, token)`, `logout()`, `updateProfile()`

### Job Store (user-app only)
Manages booking flow state: category, sub-service, issue media, created job, matched workers.

---

## Error Handling Pattern

### Global Error Boundary
```tsx
// main.tsx wraps all apps
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Per-Page Error Handling
```tsx
const [error, setError] = useState<string | null>(null);

const fetchData = useCallback(async () => {
  try {
    setError(null);
    const response = await api.get("/endpoint");
    setData(extractData<ExpectedType>(response));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load";
    setError(message);
    logger.error("Failed to fetch:", err);
  }
}, []);

if (error) return <PageError message={error} onRetry={fetchData} />;
```

---

## Authentication Flow

1. User submits credentials → `POST /api/auth/login` or `/api/auth/signup`
2. Response contains `{ user, accessToken, refreshToken }`
3. `setAuth(user, accessToken)` stores in Zustand + localStorage
4. `refreshToken` stored separately in localStorage
5. API interceptor reads token from localStorage on every request
6. 401 response → auto-logout + redirect to `/login`

### OTP Login Flow
1. `POST /api/auth/request-otp` with email
2. User receives OTP via email
3. `POST /api/auth/verify-otp` with email + code
4. Same token handling as password login

---

## WebSocket Integration

### User App Events
| Event | Handler |
|-------|---------|
| `job:accepted` | Navigate to active job |
| `job:otp` | Navigate to OTP display |
| `job:estimate` | Navigate to estimate approval |
| `job:price-approved` | Refresh job status |
| `job:scope-creep-request` | Navigate to amendment approval |
| `job:warranty-issued` | Navigate to warranty page |
| `live-tracking` | Update worker location on map |

### Worker App Events
| Event | Handler |
|-------|---------|
| `job:offer` | Navigate to job detail |
| `job:resume` | Resume after amendment |
| `job:rejected` | Show rejection notice |

### Worker Location Updates
Worker sends location every 30 seconds via `geolocation.watchPosition` → `socket.emit('update-location')`.

---

## Component Architecture

### Layout Components
- **AppLayout** (user-app): TopBar + BottomNav + content area
- **WorkerLayout** (worker-app): Sidebar + TopBar + content area
- **AdminLayout** (admin-dashboard): Sidebar + TopBar + content area

### Common Components
| Component | Purpose |
|-----------|---------|
| `LoadingSpinner` | Full-page or inline loading indicator |
| `EmptyState` | "No data" placeholder with icon |
| `ErrorBoundary` | Catches React rendering errors |
| `PageError` | Error display with retry button |
| `Badge` | Colored status badge |

### shadcn/ui Components
button, card, input, badge, skeleton, tabs, textarea (all apps)

---

## Build & Dev Commands

```bash
# Per app
cd frontend/<app>
npm install
npm run dev      # Vite dev server
npm run build    # TypeScript check + production build
npm run lint     # ESLint

# All apps simultaneously
cd frontend/user-app && npm run dev          # :5173
cd frontend/worker-app && npm run dev        # :5174
cd frontend/admin-dashboard && npm run dev   # :5175
```
