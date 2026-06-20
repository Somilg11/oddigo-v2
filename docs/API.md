# Oddigo v2 — Complete API Reference

**Base URL:** `http://localhost:3000/api`
**Auth Header:** `Authorization: Bearer <token>`

> Create 4 folders in Postman: **Public**, **User**, **Worker**, **Admin**.
> For each request, add the `Authorization` header with the JWT token from login.

---

## Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "results": 5,
  "pagination": { "page": 1, "limit": 15, "total": 50, "pages": 4 }
}
```

**Error:**
```json
{
  "success": false,
  "status": "fail",
  "message": "Error description"
}
```

---

---

# COLLECTION 1 — PUBLIC (No Auth)

---

### 1. POST `/api/auth/signup`

Register a new account.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | |
| email | string | yes | |
| phone | string | yes | |
| password | string | yes | |
| role | string | yes | `CUSTOMER` or `WORKER` |
| serviceType | string | no | Worker only — skill slug e.g. `"plumbing"` |
| hourlyRate | number | no | Worker only |
| referralCode | string | no | 8-char code from an existing user |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "role": "CUSTOMER",
      "referralCode": "JOHN1X7K"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### 2. POST `/api/auth/login`

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| password | string | yes |

**Response (200):** Same shape as signup.

---

### 3. POST `/api/auth/refresh-token`

| Field | Type | Required |
|-------|------|----------|
| refreshToken | string | yes |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### 4. POST `/api/auth/request-otp`

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |

**Response (200):**
```json
{ "success": true, "message": "OTP sent to your email" }
```

---

### 5. POST `/api/auth/verify-otp`

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| code | string | yes |

**Response (200):** Same shape as login (user + tokens).

---

### 6. GET `/api/services/categories`

No body. Returns array of active categories.

**Response (200):**
```json
{
  "success": true,
  "results": 4,
  "data": [
    { "_id": "...", "name": "Plumbing", "slug": "plumbing", "icon": "🔧", "description": "...", "isActive": true, "sortOrder": 0 }
  ]
}
```

---

### 7. GET `/api/services/sub-services?categoryId=<id>`

Optional query param `categoryId` to filter.

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
      "category": { "_id": "...", "name": "Plumbing", "slug": "plumbing", "icon": "🔧" },
      "basePrice": 299,
      "estimatedTime": 60,
      "pricingType": "ESTIMATE",
      "isActive": true
    }
  ]
}
```

---

### 8. GET `/api/services/sub-services/:id`

Get a single sub-service.

---

### 9. GET `/api/services/banners/active`

Returns active banners for the home page carousel.

**Response (200):**
```json
{
  "success": true,
  "results": 2,
  "data": [
    {
      "_id": "...",
      "title": "Monsoon Sale",
      "subtitle": "20% off plumbing",
      "imageUrl": "https://...",
      "linkUrl": "/services/plumbing",
      "type": "PROMOTION",
      "sortOrder": 0
    }
  ]
}
```

---

### 10. GET `/api/users/referral/lookup/:code`

Validate a referral code and return referrer info.

**Params:** `code` — 8-char referral code

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "referrerName": "John D.",
    "bonusPoints": 2000
  }
}
```

---

---

# COLLECTION 2 — USER (Customer Auth)

> Token from: `POST /api/auth/login` with `role: "CUSTOMER"`

---

### 11. GET `/api/users/me`

Get current user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "role": "CUSTOMER",
    "gender": "MALE",
    "dateOfBirth": "1995-06-15",
    "avatarUrl": "https://...",
    "referralCode": "JOHN1X7K",
    "addresses": [
      {
        "_id": "...",
        "label": "HOME",
        "street": "123 Main St",
        "city": "Noida",
        "state": "UP",
        "pincode": "201301",
        "landmark": "Near sector 62",
        "coordinates": [77.3910, 28.5355],
        "isDefault": true
      }
    ],
    "creditStatus": "GREEN",
    "monthlyJobsCount": 2,
    "isActive": true
  }
}
```

---

### 12. PATCH `/api/users/me`

Update profile. All fields optional.

| Field | Type | Notes |
|-------|------|-------|
| name | string | |
| email | string | |
| phone | string | |
| avatarUrl | string | |
| gender | string | `MALE`, `FEMALE`, `OTHER` |
| dateOfBirth | string | ISO date e.g. `"1995-06-15"` |

**Response (200):** Updated user object.

---

### 13. POST `/api/users/addresses`

Add a new address.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| label | string | yes | `HOME`, `WORK`, `OTHER` |
| street | string | yes | |
| city | string | yes | |
| state | string | yes | |
| pincode | string | yes | |
| landmark | string | no | |
| coordinates | number[] | no | `[longitude, latitude]` |
| isDefault | boolean | no | |

**Response (200):** Updated user with addresses array.

---

### 14. PATCH `/api/users/addresses/:id`

Update an existing address. Same fields as add, all optional.

---

### 15. DELETE `/api/users/addresses/:id`

Remove an address.

---

### 16. PATCH `/api/users/addresses/:id/default`

Set an address as default. No body needed.

---

### 17. GET `/api/users/me/points`

Get points balance.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": 3000,
    "lifetimeEarned": 5000,
    "lifetimeRedeemed": 2000
  }
}
```

---

### 18. GET `/api/users/me/points/history?page=1&limit=15`

Get points transaction history.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "EARNED",
      "points": 1000,
      "description": "First booking bonus",
      "createdAt": "2026-06-20T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 3, "pages": 1 }
}
```

---

### 19. GET `/api/users/me/referral`

Get referral info.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "referralCode": "JOHN1X7K",
    "totalPointsEarnedFromReferrals": 4000,
    "referredUsers": [
      { "name": "Jane", "createdAt": "2026-06-20", "bonusAwarded": true }
    ]
  }
}
```

---

### 20. POST `/api/coupons/validate`

Validate a coupon code.

| Field | Type | Required |
|-------|------|----------|
| code | string | yes |
| jobAmount | number | no |
| categoryId | string | no |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "maxDiscount": 200,
    "message": "10% off, max ₹200"
  }
}
```

---

### 21. POST `/api/jobs/estimate`

Get price estimate before booking.

| Field | Type | Required |
|-------|------|----------|
| serviceType | string | yes |
| lat | number | yes |
| long | number | yes |
| subServiceId | string | no |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "estimatedAmount": 388,
    "visitFee": 99,
    "basePrice": 299,
    "distanceCharge": 0
  }
}
```

---

### 22. POST `/api/jobs`

Create a new job.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| location | object | yes | `{ type: "Point", coordinates: [lng, lat] }` |
| serviceType | string | yes | e.g. `"water-leakage"` |
| subService | string | no | Sub-service ObjectId |
| couponCode | string | no | Valid coupon code |
| notes | string | no | |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "CREATED",
    "serviceType": "water-leakage",
    "initialQuote": 388,
    "visitFee": 99,
    "couponCode": "SUMMER10",
    "discount": 39
  }
}
```

---

### 23. GET `/api/jobs/history?page=1&limit=15`

Get job history for current user.

---

### 24. GET `/api/jobs/:id`

Get single job details.

---

### 25. POST `/api/jobs/:id/cancel`

Cancel a job. No body. Only works in `CREATED` or `MATCHING` status.

---

### 26. POST `/api/jobs/:id/find-workers`

Trigger worker matching. No body.

---

### 27. PATCH `/api/jobs/:id/final-approval`

Approve or reject the worker's final price estimate.

| Field | Type | Required |
|-------|------|----------|
| approved | boolean | yes |

---

### 28. PATCH `/api/jobs/:id/amendment`

Respond to worker's scope creep amendment.

| Field | Type | Required |
|-------|------|----------|
| approved | boolean | yes |

---

### 29. POST `/api/jobs/:id/signature`

Submit digital signature after job completion.

| Field | Type | Required |
|-------|------|----------|
| signatureData | string | yes | Base64 image data |

---

### 30. POST `/api/jobs/:id/pay`

Initiate payment.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentMethod | string | yes | `UPI`, `CARD`, `CASH`, `WALLET` |

---

### 31. POST `/api/jobs/:id/pay/confirm`

Confirm Razorpay payment.

| Field | Type | Required |
|-------|------|----------|
| razorpay_order_id | string | yes |
| razorpay_payment_id | string | yes |
| razorpay_signature | string | yes |

---

### 32. POST `/api/ratings/jobs/:id/rate`

Rate a completed job.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| rating | number | yes | 1-5 |
| review | string | no | |

---

### 33. GET `/api/ratings/workers/:id/ratings?page=1&limit=15`

Get a worker's ratings.

---

### 34. GET `/api/notifications?page=1&limit=15`

Get user's notifications.

---

### 35. PATCH `/api/notifications/:id/read`

Mark notification as read. No body.

---

### 36. POST `/api/warranty/:jobId/claim`

File a warranty claim.

| Field | Type | Required |
|-------|------|----------|
| description | string | yes |
| photos | string[] | no | Array of image URLs |

---

### 37. GET `/api/warranty/:jobId/status`

Check warranty status. No body.

---

---

# COLLECTION 3 — WORKER (Worker Auth)

> Token from: `POST /api/auth/login` with `role: "WORKER"`

---

### 38. GET `/api/workers/me`

Get worker profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": { "_id": "...", "name": "worker", "email": "worker@worker.com" },
    "isOnline": false,
    "skills": ["plumbing"],
    "wilsonScore": 0,
    "reliabilityScore": 0,
    "totalJobs": 0,
    "onTimeJobs": 0,
    "avgRating": 0,
    "creditEligibility": "NOT_ELIGIBLE",
    "verificationStatus": "PENDING"
  }
}
```

---

### 39. POST `/api/workers/onboarding`

Update worker profile fields. Accepts any `IWorkerProfile` field.

| Field | Type | Required |
|-------|------|----------|
| skills | string[] | no |
| creditEligibility | string | no |
| verificationStatus | string | no |

---

### 40. POST `/api/workers/availability`

Toggle online/offline.

| Field | Type | Required |
|-------|------|----------|
| isOnline | boolean | yes |
| location | object | no | `{ lat: 28.5355, long: 77.3910 }` |

---

### 41. GET `/api/workers/stats`

Get worker stats (earnings, jobs, ratings). No body.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalJobs": 15,
    "completedJobs": 12,
    "avgRating": 4.5,
    "totalEarnings": 18500,
    "monthlyEarnings": 5200
  }
}
```

---

### 42. POST `/api/workers/kyc/upload`

Upload a KYC document.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| documentType | string | yes | `AADHAAR`, `PAN`, `BANK_DETAILS`, `SKILL_TEST`, `POLICE_VERIFICATION` |
| documentUrl | string | yes | Cloudinary URL |
| documentNumber | string | no | e.g. Aadhaar number |

---

### 43. POST `/api/workers/kyc/submit`

Submit all uploaded docs for verification. No body needed.

---

### 44. GET `/api/workers/kyc`

Get KYC status and documents. No body.

---

---

# COLLECTION 4 — ADMIN (Admin Auth)

> Token from: `POST /api/auth/login` with `role: "ADMIN"`

---

## System

### 45. GET `/api/admin/health`

System health check. No body.

---

### 46. POST `/api/admin/maintenance`

Toggle maintenance mode.

| Field | Type | Required |
|-------|------|----------|
| app | string | yes | `USER` or `WORKER` |
| enabled | boolean | yes |

---

## Analytics

### 47. GET `/api/admin/analytics`

Dashboard overview.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 3,
    "totalJobs": 0,
    "totalWorkers": 1,
    "activeWorkers": 0,
    "gmv": 0,
    "monthlyGmv": 0,
    "monthlyJobCount": 0,
    "avgOrderValue": 0
  }
}
```

---

### 48. GET `/api/admin/analytics/referrals`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1,
    "referredUsers": 0,
    "referralRate": 0,
    "topReferrers": [],
    "monthlyReferrals": []
  }
}
```

---

### 49. GET `/api/admin/analytics/points`

---

### 50. GET `/api/admin/analytics/coupons`

---

## Users

### 51. PATCH `/api/admin/users/status`

Activate/deactivate a user.

| Field | Type | Required |
|-------|------|----------|
| userId | string | yes |
| isActive | boolean | yes |

---

## Workers

### 52. GET `/api/admin/workers?page=1&limit=15&search=<query>`

List all workers. Returns paginated.

---

### 53. GET `/api/admin/workers/:id`

Get worker details.

---

### 54. GET `/api/admin/workers/:id/kyc`

Get worker's KYC documents.

---

### 55. DELETE `/api/admin/workers/:id`

Deactivate worker (sets user isActive=false, deletes WorkerProfile).

---

### 56. GET `/api/admin/workers/pending-verification?page=1&limit=15`

List workers awaiting KYC verification.

---

### 57. POST `/api/admin/verify-worker`

Verify/reject a worker's KYC.

| Field | Type | Required |
|-------|------|----------|
| workerId | string | yes |
| status | string | yes | `VERIFIED`, `REJECTED`, `PENDING` |

---

### 58. POST `/api/admin/workers/bulk-verify`

Bulk verify KYC documents.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| documentIds | string[] | yes | Array of WorkerKYC document IDs |
| status | string | yes | `VERIFIED`, `REJECTED` |

---

## Operations

### 59. GET `/api/admin/operations/live`

Live operations dashboard.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pendingRequests": 0,
    "workersOnline": 0,
    "workersBusy": 0,
    "workersOffline": 1,
    "emergencyJobs": 0
  }
}
```

---

### 60. GET `/api/admin/disputes?page=1&limit=15`

List cancelled/charged jobs.

---

### 61. GET `/api/admin/complaints?status=OPEN&page=1&limit=15`

List complaints.

---

### 62. POST `/api/admin/complaints/:id/resolve`

Resolve a complaint.

| Field | Type | Required |
|-------|------|----------|
| resolution | string | yes |
| refundAmount | number | no |

---

## Services — Categories

### 63. GET `/api/admin/services/categories?page=1&limit=15`

---

### 64. POST `/api/admin/services/categories`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | min 2 chars |
| slug | string | yes | lowercase alphanumeric + hyphens |
| icon | string | no | emoji |
| description | string | no | |
| isActive | boolean | no | default true |
| sortOrder | number | no | default 0 |

---

### 65. PATCH `/api/admin/services/categories/:id`

All fields optional.

---

### 66. DELETE `/api/admin/services/categories/:id`

---

## Services — Sub-Services

### 67. GET `/api/admin/services/sub-services?categoryId=<id>`

---

### 68. POST `/api/admin/services/sub-services`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | |
| slug | string | yes | |
| category | string | yes | Category ObjectId |
| description | string | no | |
| basePrice | number | yes | >= 0 |
| estimatedTime | number | yes | minutes, >= 1 |
| pricingType | string | no | `FIXED` or `ESTIMATE` (default) |
| isActive | boolean | no | default true |

---

### 69. PATCH `/api/admin/services/sub-services/:id`

All fields optional.

---

### 70. DELETE `/api/admin/services/sub-services/:id`

---

## Banners

### 71. GET `/api/admin/banners?page=1&limit=15`

---

### 72. POST `/api/admin/banners`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | yes | |
| subtitle | string | no | |
| imageUrl | string | no | |
| linkUrl | string | no | |
| type | string | yes | `PROMOTION`, `ANNOUNCEMENT`, `COUPON`, `INFO` |
| isActive | boolean | no | default true |
| sortOrder | number | no | default 0 |
| startsAt | string | no | ISO date |
| expiresAt | string | no | ISO date |

---

### 73. PATCH `/api/admin/banners/:id`

All fields optional.

---

### 74. DELETE `/api/admin/banners/:id`

---

## Coupons

### 75. GET `/api/admin/coupons?page=1&limit=15`

---

### 76. POST `/api/admin/coupons`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | string | yes | 3-20 chars, unique |
| description | string | yes | |
| type | string | yes | `PERCENTAGE`, `FLAT`, `FREE_DELIVERY` |
| value | number | yes | >= 0 |
| minOrderAmount | number | no | |
| maxDiscount | number | no | For percentage coupons |
| usageLimit | number | no | Total uses allowed |
| perUserLimit | number | no | |
| applicableCategories | string[] | no | Category ObjectIds |
| isActive | boolean | no | default true |
| startsAt | string | no | ISO date |
| expiresAt | string | no | ISO date |

---

### 77. PATCH `/api/admin/coupons/:id`

All fields optional. Pass `null` to clear `minOrderAmount`, `maxDiscount`, etc.

---

### 78. DELETE `/api/admin/coupons/:id`

---

---

# COLLECTION 5 — OTHER ROLES

> These roles have separate dashboards (not the admin dashboard).

---

## Field Executive

> Token from: `POST /api/auth/login` with `role: "FIELD_EXECUTIVE"`

### 79. GET `/api/field-executive/workers`

List assigned workers.

---

### 80. GET `/api/field-executive/worker/:id/status`

Check specific worker status.

---

### 81. POST `/api/field-executive/worker/:id/visit`

Log a field visit.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string | yes | `CHECK_IN`, `FOLLOW_UP`, `QUALITY_AUDIT`, `COMPLAINT_HANDLE` |
| notes | string | yes | |
| photos | string[] | no | Image URLs |
| location | object | no | `{ lat, long }` |

---

### 82. GET `/api/field-executive/quality-audit?page=1&limit=15`

Get audit list.

---

### 83. POST `/api/field-executive/quality-audit/:jobId`

Submit quality audit.

| Field | Type | Required |
|-------|------|----------|
| hasBeforePhotos | boolean | yes |
| hasAfterPhotos | boolean | yes |
| invoiceValid | boolean | yes |
| notes | string | no |

---

## Zone Manager

> Token from: `POST /api/auth/login` with `role: "ZONE_MANAGER"`

### 84. GET `/api/zone-manager/zones`

List assigned zones.

---

### 85. GET `/api/zone-manager/zones/:id/stats`

Get zone analytics.

---

### 86. GET `/api/zone-manager/zones/:id/supply-demand`

Get supply/demand ratio.

---

### 87. POST `/api/zone-manager/zones/:id/recruit`

Trigger recruitment.

| Field | Type | Required |
|-------|------|----------|
| skillNeeded | string | yes |
| countNeeded | number | yes |
| reason | string | no |

---

## City Manager

> Token from: `POST /api/auth/login` with `role: "CITY_MANAGER"`

### 88. GET `/api/city-manager/dashboard`

City-wide metrics.

---

### 89. GET `/api/city-manager/zones`

List zones in assigned cities.

---

### 90. POST `/api/city-manager/zones`

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| city | string | yes |
| center | object | yes | `{ lat, long }` |
| radiusKm | number | no | default 5 |

---

### 91. POST `/api/city-manager/categories`

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| slug | string | yes |
| icon | string | no |
| description | string | no |

---

### 92. POST `/api/city-manager/campaigns`

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| description | string | no |
| city | string | yes |
| discountPercent | number | no |
| discountCode | string | no |
| startDate | string | yes | ISO date |
| endDate | string | yes | ISO date |

---

---

# WebSocket

**Connect:** `io('http://localhost:3000', { auth: { token: 'Bearer <jwt>' } })`

| Direction | Event | Data | Description |
|-----------|-------|------|-------------|
| Client→Server | `update-location` | `{ lat, long, jobId? }` | Worker location update |
| Client→Server | `join-job` | `jobId` | Join job room |
| Server→Client | `job:offer` | `{ jobId, serviceType, price }` | New job for worker |
| Server→Client | `job:scope-creep-request` | `{ jobId, reason, amount }` | Amendment request |
| Server→Client | `job:warranty-issued` | `{ jobId, warranty: true }` | Job completed |
| Server→Client | `job:otp` | `{ jobId, otp }` | OTP to customer |
| Server→Client | `job:estimate` | `{ jobId, estimate }` | Worker submitted estimate |
| Server→Client | `job:price-approved` | `{ jobId, approved }` | Price approved |
| Server→Client | `live-tracking` | `{ userId, lat, long }` | Real-time location |

---

# Job Status Flow

```
CREATED → MATCHING → ACCEPTED → IN_PROGRESS → OTP_PENDING → IN_PROGRESS
  → ON_SITE_DIAGNOSIS → FINAL_APPROVAL_PENDING → REPAIR_IN_PROGRESS
  → COMPLETED → (Payment) → RATED
```

**Cancellation:** `CREATED`/`MATCHING` → `CANCELLED` (by customer)
**Amendment rejected:** → `CANCELLED_CHARGED`

---

# Roles

| Role | Postman Folder |
|------|---------------|
| `CUSTOMER` | User |
| `WORKER` | Worker |
| `ADMIN` | Admin |
| `FIELD_EXECUTIVE` | Other |
| `ZONE_MANAGER` | Other |
| `CITY_MANAGER` | Other |

---

# Postman Testing Order

1. **Public** → Sign up customer, worker, admin (or use existing DB users)
2. **Public** → Login as customer → copy token
3. **User** → Test profile, addresses, points, referral
4. **User** → Create job, test coupon validate, estimate
5. **Public** → Login as worker → copy token
6. **Worker** → Test profile, availability, KYC upload, submit
7. **User** → Find workers → (worker accepts, OTP, estimate, complete)
8. **User** → Pay, rate
9. **Public** → Login as admin → copy token
10. **Admin** → Test analytics, workers list, verify worker, categories, banners, coupons, maintenance
