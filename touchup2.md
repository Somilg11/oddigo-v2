# Oddigo v2 — Touchup 2: Future Implementation Plan

> Updated: 2026-06-20
> Covers map/geotracking, area management dashboards, and remaining polish items.
> Items marked ✅ are already implemented.

---

## Table of Contents

1. [Map & Worker Geotracking](#1-map--worker-geotracking)
2. [Zone Manager Dashboard](#2-zone-manager-dashboard)
3. [City Manager Dashboard](#3-city-manager-dashboard)
4. [Field Executive Dashboard](#4-field-executive-dashboard)
5. [Remaining Polish & Tech Debt](#5-remaining-polish--tech-debt)

---

## 1. Map & Worker Geotracking

### Current State

| Layer | Status | Details |
|-------|--------|---------|
| Redis GEOADD on socket `update-location` | ✅ | `socket.service.ts:44` — worker location stored in Redis geo-set |
| Redis GEOADD on REST `toggleAvailability` | ✅ | `worker.service.ts:44` — worker added on online, removed on offline |
| Redis GEORADIUS for worker matching | ✅ | `matching.engine.ts:47` — 10km radius search |
| MongoDB `WorkerProfile.lastLocation` | ✅ | Updated on both socket and REST paths |
| Socket `live-tracking` event broadcast | ✅ | `socket.service.ts:60` — emits to job room |
| `useLocationUpdates` hook (worker) | ✅ | `worker-app/src/hooks/useSocket.ts` — `navigator.geolocation.watchPosition()` |
| `useWorkerTracking` hook (user) | ✅ | `user-app/src/hooks/useSocket.ts` — listens for `live-tracking` |
| **Map library installed** | ❌ | No Mapbox, Google Maps, Leaflet, or MapLibre |
| **Interactive map component** | ❌ | User sees raw lat/long text, not a map |
| **Worker marker/pin on map** | ❌ | No visual marker rendering |
| **Route/directions display** | ❌ | No path from worker to customer |
| **Distance/ETA calculation** | ❌ | No distance shown to user |
| **Persistent location tracking** | ❌ | Only works while on ActiveJobPage |
| **Admin live ops map** | ❌ | No map view for admin to see all workers |

### What to Build

#### 1A. Install Map Library

**Recommended:** [MapLibre GL JS](https://maplibre.org/) (free, open-source, no API key needed for basic tiles)

```bash
# In user-app and admin-dashboard:
npm install maplibre-gl
```

For the worker app, a map is less critical (worker just shares location), but could be added for navigation.

#### 1B. User App — Live Tracking Map

**File:** `frontend/user-app/src/pages/job/ActiveJobPage.tsx`

Replace the raw lat/long text display with an interactive map:

```tsx
// Pseudocode
import maplibregl from 'maplibre-gl';

// In useEffect, initialize map when workerLocation is set:
const map = new maplibregl.Map({
    container: mapRef.current,
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // free tiles
    center: [workerLocation.long, workerLocation.lat],
    zoom: 15
});

// Add worker marker
const marker = new maplibregl.Marker({ color: '#000' })
    .setLngLat([workerLocation.long, workerLocation.lat])
    .addTo(map);

// Add customer marker (job location)
new maplibregl.Marker({ color: '#ef4444' })
    .setLngLat(job.location.coordinates)
    .addTo(map);
```

**Features:**
- Show worker as black marker, customer as red marker
- Auto-center on worker location
- Show distance between worker and customer
- Show ETA (simple calculation: distance / 30km/h average speed)

#### 1C. Worker App — Navigation View

**File:** `frontend/worker-app/src/pages/jobs/ActiveJobPage.tsx`

Show a simple map with:
- Worker's current position
- Customer location (job location)
- Straight-line direction

Optionally integrate with device's native maps for turn-by-turn navigation:
```tsx
const openInMaps = () => {
    const { coordinates } = job.location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`);
};
```

#### 1D. Admin Dashboard — Live Operations Map

**File:** `frontend/admin-dashboard/src/pages/operations/LiveOpsPage.tsx`

Add a map view showing:
- All online workers as markers
- Active jobs as markers
- Color coding: green = available, yellow = busy, red = emergency

**New backend endpoint needed:**
```
GET /api/admin/operations/worker-locations
```
Returns all online workers with their last known locations.

**Backend implementation:** Add to `admin.controller.ts`:
```typescript
static async getWorkerLocations(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const workers = await WorkerProfile.find({ isOnline: true })
            .populate('user', 'name phone')
            .select('user lastLocation wilsonScore isOnline');
        res.status(200).json({ success: true, data: workers });
    } catch (error) { next(error); }
}
```

#### 1E. Distance & ETA Calculation

Create a utility function:
```typescript
// src/shared/utils/geo.ts
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function estimateETA(distanceKm: number): number {
    // Average urban speed: 25 km/h (including traffic)
    return Math.round((distanceKm / 25) * 60); // minutes
}
```

Wire into:
- User ActiveJobPage: show "Worker is X km away, arriving in ~Y min"
- Admin LiveOps: show distance from each worker to their active job

### Files to Create/Change

| File | Change |
|------|--------|
| `frontend/user-app/package.json` | Add `maplibre-gl` |
| `frontend/admin-dashboard/package.json` | Add `maplibre-gl` |
| `frontend/user-app/src/pages/job/ActiveJobPage.tsx` | Replace text with interactive map |
| `frontend/worker-app/src/pages/jobs/ActiveJobPage.tsx` | Add "Open in Maps" button |
| `frontend/admin-dashboard/src/pages/operations/LiveOpsPage.tsx` | Add worker location map |
| `src/modules/admin/controllers/admin.controller.ts` | Add `getWorkerLocations` endpoint |
| `src/modules/admin/routes/admin.routes.ts` | Add route |
| `src/shared/utils/geo.ts` | NEW — distance/ETA utilities |

---

## 2. Zone Manager Dashboard

### Current State

The backend has full Zone Manager support:

| Endpoint | Status | File |
|----------|--------|------|
| `GET /api/zone-manager/zones` | ✅ | `zone-manager.controller.ts` |
| `GET /api/zone-manager/zones/:id/stats` | ✅ | `zone-manager.controller.ts` |
| `GET /api/zone-manager/zones/:id/supply-demand` | ✅ | `zone-manager.controller.ts` |
| `POST /api/zone-manager/zones/:id/recruit` | ✅ | `zone-manager.controller.ts` |
| `POST /api/zone-manager/zones` | ✅ | `zone-manager.controller.ts` |

**Frontend:** ❌ No Zone Manager dashboard exists. No pages, no routes, no UI.

### What to Build

#### 2A. New Frontend App: `frontend/zone-manager-app/`

Or add zone manager pages to the admin dashboard (simpler approach). The admin dashboard could have a "Zone Manager" section visible only to users with `ZONE_MANAGER` role.

**Recommended:** Add to admin dashboard with role-based visibility.

#### 2B. Zone Manager Pages

| Page | Route | Description |
|------|-------|-------------|
| `ZoneDashboardPage.tsx` | `/zone-manager` | Overview: assigned zones, key metrics |
| `ZoneDetailPage.tsx` | `/zone-manager/zones/:id` | Single zone: revenue, workers, jobs, supply/demand |
| `SupplyDemandPage.tsx` | `/zone-manager/zones/:id/supply-demand` | Worker vs request ratio visualization |
| `RecruitmentPage.tsx` | `/zone-manager/zones/:id/recruit` | Trigger worker recruitment for a zone |

#### 2C. Zone Dashboard Features

**ZoneDashboardPage:**
- List of assigned zones with summary cards
- Each card shows: zone name, radius, worker count, active jobs, revenue
- Click to drill into zone detail

**ZoneDetailPage:**
- Revenue chart (daily/weekly)
- Worker count (online vs total)
- Active jobs count
- Average rating
- Supply/demand ratio
- Recent jobs list

**SupplyDemandPage:**
- Visual gauge showing worker-to-request ratio
- Alert when `pendingRequests > availableWorkers * 2`
- Historical trend chart

**RecruitmentPage:**
- One-click recruitment trigger
- Shows current shortfall
- Confirmation dialog

### Files to Create/Change

| File | Change |
|------|--------|
| `frontend/admin-dashboard/src/pages/zone-manager/ZoneDashboardPage.tsx` | NEW |
| `frontend/admin-dashboard/src/pages/zone-manager/ZoneDetailPage.tsx` | NEW |
| `frontend/admin-dashboard/src/pages/zone-manager/SupplyDemandPage.tsx` | NEW |
| `frontend/admin-dashboard/src/pages/zone-manager/RecruitmentPage.tsx` | NEW |
| `frontend/admin-dashboard/src/App.tsx` | Add zone-manager routes |
| `frontend/admin-dashboard/src/components/layout/AdminSidebar.tsx` | Add "Zone Manager" nav (visible to ZONE_MANAGER role) |

---

## 3. City Manager Dashboard

### Current State

Backend has endpoints:

| Endpoint | Status | File |
|----------|--------|------|
| `GET /api/city-manager/dashboard` | ✅ | `city-manager.controller.ts` |
| `GET /api/city-manager/zones` | ✅ | `city-manager.controller.ts` |
| `POST /api/city-manager/zones` | ✅ | `city-manager.controller.ts` |
| `POST /api/city-manager/categories` | ✅ | `city-manager.controller.ts` |
| `POST /api/city-manager/campaigns` | ✅ | `city-manager.controller.ts` |

**Frontend:** ❌ No City Manager dashboard exists.

### What to Build

#### 3A. City Manager Pages (add to admin dashboard)

| Page | Route | Description |
|------|-------|-------------|
| `CityDashboardPage.tsx` | `/city-manager` | City-level overview |
| `CityZonesPage.tsx` | `/city-manager/zones` | Manage zones within city |
| `CityCampaignsPage.tsx` | `/city-manager/campaigns` | Marketing campaigns |

#### 3B. City Dashboard Features

**CityDashboardPage:**
- Total orders, revenue, workers, ratings, cancellation %
- Zone-wise breakdown table
- Trend charts

**CityZonesPage:**
- List of zones with stats
- Create new zone (with map polygon drawing — future)
- Zone activation/deactivation

**CityCampaignsPage:**
- Create/manage marketing campaigns
- Campaign status (DRAFT, ACTIVE, PAUSED, COMPLETED)
- Link to Banner system (coupons/promotions)

### Files to Create/Change

| File | Change |
|------|--------|
| `frontend/admin-dashboard/src/pages/city-manager/CityDashboardPage.tsx` | NEW |
| `frontend/admin-dashboard/src/pages/city-manager/CityZonesPage.tsx` | NEW |
| `frontend/admin-dashboard/src/pages/city-manager/CityCampaignsPage.tsx` | NEW |
| `frontend/admin-dashboard/src/App.tsx` | Add city-manager routes |
| `frontend/admin-dashboard/src/components/layout/AdminSidebar.tsx` | Add "City Manager" nav (visible to CITY_MANAGER role) |

---

## 4. Field Executive Dashboard

### Current State

Backend has endpoints:

| Endpoint | Status | File |
|----------|--------|------|
| `GET /api/field-executive/workers` | ✅ | `field-executive.controller.ts` |
| `GET /api/field-executive/worker/:id/status` | ✅ | `field-executive.controller.ts` |
| `POST /api/field-executive/worker/:id/visit` | ✅ | `field-executive.controller.ts` |
| `GET /api/field-executive/quality-audit` | ✅ | `field-executive.controller.ts` |
| `POST /api/field-executive/quality-audit/:jobId` | ✅ | `field-executive.controller.ts` |

**Frontend:** ❌ No Field Executive dashboard exists.

### What to Build

#### 4A. Field Executive Pages (add to admin dashboard)

| Page | Route | Description |
|------|-------|-------------|
| `FieldExecDashboardPage.tsx` | `/field-executive` | Assigned workers overview |
| `WorkerStatusPage.tsx` | `/field-executive/worker/:id` | Individual worker status |
| `FieldVisitsPage.tsx` | `/field-executive/visits` | Visit history and logging |
| `QualityAuditsPage.tsx` | `/field-executive/audits` | Audit list and submission |

#### 4B. Field Executive Features

**FieldExecDashboardPage:**
- List of 50 assigned workers
- Each worker: name, online status, current job, last visit date
- Quick actions: log visit, view status, submit audit

**WorkerStatusPage:**
- Worker profile card
- Online/offline status
- Active job details
- Recent jobs
- Quality audit history

**FieldVisitsPage:**
- Log new visit (type: CHECK_IN, FOLLOW_UP, QUALITY_AUDIT, COMPLAINT_HANDLE)
- Visit history with notes
- Filter by worker, date, type

**QualityAuditsPage:**
- Submit audit: before photos, after photos, invoice, status (PASSED/FAILED)
- Audit history
- Worker-wise audit summary

### Files to Create/Change

| File | Change |
|------|--------|
| `frontend/admin-dashboard/src/pages/field-executive/FieldExecDashboardPage.tsx` | NEW |
| `frontend/admin-dashboard/src/pages/field-executive/WorkerStatusPage.tsx` | NEW |
| `frontend/admin-dashboard/src/pages/field-executive/FieldVisitsPage.tsx` | NEW |
| `frontend/admin-dashboard/src/pages/field-executive/QualityAuditsPage.tsx` | NEW |
| `frontend/admin-dashboard/src/App.tsx` | Add field-executive routes |
| `frontend/admin-dashboard/src/components/layout/AdminSidebar.tsx` | Add "Field Ops" nav (visible to FIELD_EXECUTIVE role) |

---

## 5. Remaining Polish & Tech Debt

### 5A. Admin Role-Based Sidebar Visibility

Currently the admin sidebar shows all nav items to all users. It should filter items based on the user's role:

- **ADMIN**: All items
- **ZONE_MANAGER**: Zone Manager section only
- **CITY_MANAGER**: City Manager section only
- **FIELD_EXECUTIVE**: Field Ops section only

**Implementation:** Read `user.role` from auth store and conditionally render nav items.

### 5B. Campaign System Integration

The existing `Campaign` model (`src/modules/city-manager/models/Campaign.ts`) has `discountPercent` and `discountCode` fields but is completely unwired. Options:

1. **Extend Campaign to use Coupon system** — Campaign creates Coupons automatically
2. **Deprecate Campaign discount fields** — Use the new Coupon system instead
3. **Keep both** — Campaign for marketing, Coupon for discounts

**Recommended:** Option 2 — deprecate Campaign discount fields, link campaigns to banners for display.

### 5C. Real-Time Notifications via Socket

Currently notifications are stored in MongoDB and polled via REST. For better UX:

- Emit socket events for new notifications
- Show real-time badge count in TopBar
- Push notifications for job offers, OTP, warranty

### 5D. Image Upload Optimization

Currently images are uploaded directly to Cloudinary from the frontend. Consider:
- Backend upload endpoint with image compression
- Progressive upload with status indicator
- Thumbnail generation for list views

### 5E. Error Boundary Per Route

Add error boundaries around each route in all 3 apps to prevent full-page crashes:
```tsx
<ErrorBoundary>
    <Routes>
        <Route path="/" element={<HomePage />} />
        ...
    </Routes>
</ErrorBoundary>
```

### 5F. Loading States & Skeleton Screens

Replace LoadingSpinner with skeleton screens for better perceived performance:
- Card skeletons for list pages
- Form skeletons for detail pages
- Map skeleton for tracking page

### 5G. Analytics & Reporting

Admin analytics page currently shows basic stats. Add:
- Revenue charts (daily/weekly/monthly)
- Job completion rate trends
- Worker performance rankings
- Customer satisfaction metrics
- Service category breakdown

### 5H. Worker App Enhancements

- Earnings dashboard with charts
- Job history with filters
- Rating breakdown (5-star distribution)
- Availability schedule management
- Skill certification upload

---

## Execution Order

### Priority 1: Map Integration (1-2 days)
1. Install MapLibre GL in user-app and admin-dashboard
2. Create `src/shared/utils/geo.ts` for distance/ETA
3. Update user ActiveJobPage with interactive map
4. Add "Open in Maps" to worker ActiveJobPage
5. Add worker location endpoint to admin
6. Add map view to admin LiveOps page

### Priority 2: Area Manager Dashboards (3-5 days)
1. Add role-based sidebar visibility to admin
2. Build Zone Manager pages (4 pages)
3. Build City Manager pages (3 pages)
4. Build Field Executive pages (4 pages)

### Priority 3: Polish (2-3 days)
1. Skeleton screens
2. Error boundaries per route
3. Real-time notification badges
4. Analytics charts
5. Campaign integration

**Total estimated effort: 6-10 days**
