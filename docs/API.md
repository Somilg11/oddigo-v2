# API Documentation - Oddigo v2 Backend

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>` header.

---

## Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "results": 5,           // optional - count for list endpoints
  "pagination": {         // optional - for paginated endpoints
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "status": "fail",
  "message": "Error description"
}
```

---

## 1. Auth (`/api/auth`)

### POST `/api/auth/signup`
Create a new user account.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "securePassword123",
  "role": "CUSTOMER"    // CUSTOMER | WORKER
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "John Doe", "email": "john@example.com", "role": "CUSTOMER" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### POST `/api/auth/login`
Login with email and password.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):** Same as signup response.

### POST `/api/auth/request-otp`
Request OTP for email-based login.

**Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

### POST `/api/auth/verify-otp`
Verify OTP and receive JWT tokens.

**Body:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response (200):** Same as login response.

---

## 2. Users (`/api/users`) - Protected

### GET `/api/users/me`
Get current user profile.

### PATCH `/api/users/me`
Update user profile.

**Body (all optional):**
```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "phone": "+919876543211",
  "avatarUrl": "https://..."
}
```

### POST `/api/users/addresses`
Add an address.

**Body:**
```json
{
  "street": "123 Main St",
  "city": "Noida",
  "zip": "201301",
  "coordinates": [77.3910, 28.5355]
}
```

### DELETE `/api/users/addresses/:id`
Remove an address.

---

## 3. Workers (`/api/workers`) - Protected, Worker only

### GET `/api/workers/me`
Get worker profile.

### POST `/api/workers/onboarding`
Update worker profile (skills, etc).

**Body:**
```json
{
  "skills": ["plumber", "plumbing"],
  "creditEligibility": "ELIGIBLE"
}
```

### POST `/api/workers/availability`
Toggle online/offline status.

**Body:**
```json
{
  "isOnline": true,
  "location": { "lat": 28.5355, "long": 77.3910 }
}
```

### GET `/api/workers/stats`
Get earnings and job statistics.

### POST `/api/workers/kyc/upload`
Upload KYC document.

**Body:**
```json
{
  "documentType": "AADHAAR",
  "documentUrl": "https://cloudinary.com/...",
  "documentNumber": "1234-5678-9012"
}
```
Document types: `AADHAAR`, `PAN`, `BANK_DETAILS`, `SKILL_TEST`, `POLICE_VERIFICATION`

### GET `/api/workers/kyc`
Get KYC status and documents.

---

## 4. Services (`/api/services`) - Public

### GET `/api/services/categories`
List all active service categories.

**Response (200):**
```json
{
  "success": true,
  "results": 4,
  "data": [
    { "_id": "...", "name": "Plumbing", "slug": "plumbing", "icon": "🔧", "description": "..." },
    { "_id": "...", "name": "Electrical Appliances", "slug": "electrical-appliances", "icon": "⚡" }
  ]
}
```

### GET `/api/services/sub-services`
List sub-services. Optionally filter by `?categoryId=<id>`.

**Response (200):**
```json
{
  "success": true,
  "results": 6,
  "data": [
    {
      "_id": "...",
      "name": "Water Leakage",
      "slug": "water-leakage",
      "category": { "name": "Plumbing", "slug": "plumbing", "icon": "🔧" },
      "basePrice": 299,
      "estimatedTime": 60,
      "pricingType": "ESTIMATE"
    }
  ]
}
```

### GET `/api/services/sub-services/:id`
Get a single sub-service by ID.

---

## 5. Jobs (`/api/jobs`) - Protected

### POST `/api/jobs`
Create a new job.

**Body:**
```json
{
  "serviceType": "water-leakage",
  "subService": "<subServiceId>",
  "subServiceName": "Water Leakage",
  "location": {
    "coordinates": [77.3910, 28.5355],
    "address": "123 Main St, Noida"
  },
  "photos": ["https://..."],
  "videos": ["https://..."],
  "customIssue": "Water leaking from kitchen pipe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "CREATED",
    "initialQuote": 388,
    "visitFee": 99,
    ...
  }
}
```

### POST `/api/jobs/estimate`
Get price estimate.

**Body:**
```json
{
  "serviceType": "water-leakage",
  "lat": 28.5355,
  "long": 77.3910,
  "subService": "<subServiceId>"
}
```

### POST `/api/jobs/:id/cancel`
Cancel a job (only CREATED/MATCHING status).

### GET `/api/jobs/:id`
Get job details.

### GET `/api/jobs/history`
Get all jobs for the current user/worker.

### POST `/api/jobs/:id/find-workers`
Trigger worker matching engine (worker pool).

### POST `/api/jobs/:id/accept`
Worker accepts the job.

### PATCH `/api/jobs/:id/start`
Worker marks job as started.

### POST `/api/jobs/:id/request-otp`
Worker requests OTP from customer.

**Response:**
```json
{
  "success": true,
  "data": { "message": "OTP sent to customer" }
}
```

### POST `/api/jobs/:id/verify-otp`
Worker verifies OTP to confirm presence.

**Body:**
```json
{
  "otp": "123456"
}
```

### POST `/api/jobs/:id/estimate`
Worker submits cost estimate.

**Body:**
```json
{
  "visitCharge": 99,
  "labourCost": 200,
  "partsCost": 150,
  "notes": "Need to replace washer"
}
```

### PATCH `/api/jobs/:id/final-approval`
Customer approves/rejects final price.

**Body:**
```json
{
  "approved": true
}
```

### POST `/api/jobs/:id/before-photo`
Worker uploads before photo.

**Body:**
```json
{
  "photoUrl": "https://cloudinary.com/..."
}
```

### POST `/api/jobs/:id/after-photo`
Worker uploads after photo.

**Body:**
```json
{
  "photoUrl": "https://cloudinary.com/..."
}
```

### POST `/api/jobs/:id/complete`
Worker completes job (with AI verification).

**Body:**
```json
{
  "proofUrl": "https://cloudinary.com/after-photo.jpg",
  "customerSignature": "base64-signature-data"
}
```

### POST `/api/jobs/:id/amendment`
Worker requests scope creep amendment.

**Body:**
```json
{
  "reason": "Additional pipe replacement needed",
  "proposedAmount": 800,
  "evidenceUrl": "https://cloudinary.com/evidence.jpg"
}
```

### PATCH `/api/jobs/:id/amendment`
Customer approves/rejects amendment.

**Body:**
```json
{
  "approved": true
}
```

### POST `/api/jobs/:id/signature`
Customer submits digital signature.

**Body:**
```json
{
  "signatureData": "base64-encoded-signature"
}
```

### POST `/api/jobs/:id/pay`
Process payment for completed job.

**Body:**
```json
{
  "paymentMethod": "UPI"    // UPI | CARD | CASH | WALLET
}
```

### POST `/api/jobs/:id/refund`
Admin refunds a job.

**Body:**
```json
{
  "reason": "Worker no-show"
}
```

---

## 6. Ratings (`/api/ratings`) - Protected

### POST `/api/ratings/jobs/:id/rate`
Rate a completed job.

**Body:**
```json
{
  "rating": 5,
  "review": "Excellent work!"
}
```

### GET `/api/ratings/workers/:id/ratings`
Get worker ratings. Query params: `?page=1&limit=20`

---

## 7. Warranty (`/api/warranty`) - Protected

### POST `/api/warranty/:jobId/claim`
File a warranty claim.

**Body:**
```json
{
  "description": "Issue reoccurred after 3 days",
  "photos": ["https://..."]
}
```

### GET `/api/warranty/:jobId/status`
Check warranty status and claim.

### PATCH `/api/warranty/:claimId/resolve` - Admin only
Resolve a warranty claim.

**Body:**
```json
{
  "status": "RESOLVED",
  "adminNotes": "Worker dispatched for re-repair"
}
```

---

## 8. Notifications (`/api/notifications`) - Protected

### GET `/api/notifications`
Get user's last 50 notifications.

### PATCH `/api/notifications/:id/read`
Mark notification as read.

---

## 9. Field Executive (`/api/field-executive`) - Protected, FIELD_EXECUTIVE role

### GET `/api/field-executive/workers`
List assigned workers.

### GET `/api/field-executive/worker/:id/status`
Check specific worker status.

### POST `/api/field-executive/worker/:id/visit`
Log a field visit.

**Body:**
```json
{
  "type": "CHECK_IN",
  "notes": "Routine check-in",
  "photos": ["https://..."],
  "location": { "lat": 28.5355, "long": 77.3910 }
}
```
Visit types: `CHECK_IN`, `FOLLOW_UP`, `QUALITY_AUDIT`, `COMPLAINT_HANDLE`

### GET `/api/field-executive/quality-audit`
Get audit list. Query: `?page=1&limit=20`

### POST `/api/field-executive/quality-audit/:jobId`
Submit quality audit.

**Body:**
```json
{
  "hasBeforePhotos": true,
  "hasAfterPhotos": true,
  "invoiceValid": true,
  "notes": "All checks passed"
}
```

---

## 10. Zone Manager (`/api/zone-manager`) - Protected, ZONE_MANAGER role

### GET `/api/zone-manager/zones`
List assigned zones.

### GET `/api/zone-manager/zones/:id/stats`
Get zone analytics (revenue, supply, demand).

### GET `/api/zone-manager/zones/:id/supply-demand`
Get worker vs request ratio.

**Response:**
```json
{
  "success": true,
  "data": {
    "zone": { "name": "Sector 137" },
    "supply": { "online": 10, "busy": 5, "available": 5 },
    "demand": { "pendingRequests": 15, "last24h": "..." },
    "ratio": 3,
    "needsRecruitment": true
  }
}
```

### POST `/api/zone-manager/zones/:id/recruit`
Trigger recruitment.

**Body:**
```json
{
  "skillNeeded": "electrician",
  "countNeeded": 10,
  "reason": "High demand in sector"
}
```

---

## 11. City Manager (`/api/city-manager`) - Protected, CITY_MANAGER role

### GET `/api/city-manager/dashboard`
Get city-wide metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalOrders": 1250,
      "monthlyRevenue": 450000,
      "activeWorkers": 85,
      "pendingJobs": 12,
      "completedToday": 45,
      "cancelledToday": 3,
      "cancellationRate": "6.3%",
      "averageRating": 4.3
    }
  }
}
```

### GET `/api/city-manager/zones`
List all zones in assigned cities.

### POST `/api/city-manager/zones`
Create a new zone.

**Body:**
```json
{
  "name": "Sector 137",
  "city": "Noida",
  "center": { "lat": 28.5355, "long": 77.3910 },
  "radiusKm": 5
}
```

### POST `/api/city-manager/categories`
Add new service category.

**Body:**
```json
{
  "name": "Carpentry",
  "slug": "carpentry",
  "icon": "🪚",
  "description": "Woodwork and furniture repair"
}
```

### POST `/api/city-manager/campaigns`
Create marketing campaign.

**Body:**
```json
{
  "name": "Monsoon Sale",
  "description": "20% off on all plumbing services",
  "city": "Noida",
  "discountPercent": 20,
  "discountCode": "MONSOON20",
  "startDate": "2026-07-01",
  "endDate": "2026-07-31"
}
```

---

## 12. Admin (`/api/admin`) - Protected, ADMIN role

### GET `/api/admin/health`
System health check (all providers).

### GET `/api/admin/analytics`
Dashboard analytics (users, jobs, GMV).

### GET `/api/admin/disputes`
Get cancelled/charged jobs.

### POST `/api/admin/maintenance`
Toggle maintenance mode.

**Body:**
```json
{
  "app": "USER",
  "enabled": true
}
```

### POST `/api/admin/verify-worker`
Verify/reject a worker.

**Body:**
```json
{
  "workerId": "...",
  "status": "VERIFIED"
}
```

### PATCH `/api/admin/users/status`
Activate/deactivate user.

**Body:**
```json
{
  "userId": "...",
  "isActive": false
}
```

### GET `/api/admin/operations/live`
Live operations dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "pendingRequests": 5,
    "workersOnline": 45,
    "workersBusy": 12,
    "workersOffline": 33,
    "emergencyJobs": 1
  }
}
```

### GET `/api/admin/complaints`
List complaints. Query: `?status=OPEN&page=1&limit=20`

### POST `/api/admin/complaints/:id/resolve`
Resolve a complaint.

**Body:**
```json
{
  "resolution": "Refund issued to customer",
  "refundAmount": 500
}
```

### GET `/api/admin/workers/pending-verification`
Get pending KYC verifications. Query: `?page=1&limit=20`

### POST `/api/admin/workers/bulk-verify`
Bulk verify KYC documents.

**Body:**
```json
{
  "documentIds": ["id1", "id2", "id3"],
  "status": "VERIFIED"
}
```

---

## 13. WebSocket Events

Connect with: `io('http://localhost:3000', { auth: { token: 'Bearer <jwt>' } })`

### Client Events
| Event | Data | Description |
|-------|------|-------------|
| `update-location` | `{ lat, long, jobId? }` | Update worker location |
| `join-job` | `jobId` | Join a job room for live updates |

### Server Events
| Event | Data | Description |
|-------|------|-------------|
| `job:offer` | `{ jobId, serviceType, price }` | New job offer for worker |
| `job:scope-creep-request` | `{ jobId, reason, amount }` | Amendment request |
| `job:warranty-issued` | `{ jobId, warranty: true }` | Job completed + warranty |
| `job:otp` | `{ jobId, otp }` | OTP sent to customer |
| `job:estimate` | `{ jobId, estimate }` | Worker submitted estimate |
| `job:price-approved` | `{ jobId, approved }` | Customer approved price |
| `live-tracking` | `{ userId, lat, long }` | Real-time location update |

---

## Job Status Flow

```
CREATED → MATCHING → ACCEPTED → IN_PROGRESS → OTP_PENDING → IN_PROGRESS
  → ON_SITE_DIAGNOSIS → FINAL_APPROVAL_PENDING → REPAIR_IN_PROGRESS
  → COMPLETED → (Payment)
```

### Cancellation
- `CREATED` or `MATCHING` → `CANCELLED` (by customer)
- Amendment rejected → `CANCELLED_CHARGED`

---

## Roles

| Role | Access |
|------|--------|
| `CUSTOMER` | Create jobs, approve estimates, rate, pay |
| `WORKER` | Accept jobs, manage availability, upload KYC |
| `ADMIN` | Full system access, worker verification, complaints |
| `FIELD_EXECUTIVE` | Manage assigned workers, quality audits |
| `ZONE_MANAGER` | Zone analytics, recruitment |
| `CITY_MANAGER` | City dashboard, zones, categories, campaigns |
