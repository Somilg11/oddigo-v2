# Admin API

**Base URL:** `/api/admin`
**Auth Required:** Yes — `Authorization: Bearer <token>` (ADMIN role only)

---

## System

### 1. GET `/api/admin/health`

Check status of all external providers.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "services": [
      { "service": "Email (SMTP)", "status": "UP", "latency": 150 },
      { "service": "OTP Service (Redis)", "status": "UP", "latency": 5 },
      { "service": "Razorpay", "status": "UP", "latency": 200 }
    ],
    "maintenance": {
      "userApp": false,
      "workerApp": false
    }
  }
}
```

---

### 2. POST `/api/admin/maintenance`

Toggle maintenance mode per app.

| Field | Type | Required |
|-------|------|----------|
| app | string | yes | `USER` or `WORKER` |
| enabled | boolean | yes |

**Example:**
```json
{ "app": "USER", "enabled": true }
```

---

## Analytics

### 3. GET `/api/admin/analytics`

Dashboard overview metrics.

#### Response (200)
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

### 4. GET `/api/admin/analytics/referrals`

#### Response (200)
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

### 5. GET `/api/admin/analytics/points`

#### Response (200)
```json
{
  "success": true,
  "data": {
    "totalBalance": 3000,
    "totalEarned": 5000,
    "totalRedeemed": 2000,
    "usersWithPoints": 2,
    "recentTransactions": []
  }
}
```

---

### 6. GET `/api/admin/analytics/coupons`

#### Response (200)
```json
{
  "success": true,
  "data": {
    "totalCoupons": 3,
    "activeCoupons": 2,
    "totalUsageCount": 15,
    "topCoupons": [],
    "monthlyUsage": []
  }
}
```

---

## Users

### 7. PATCH `/api/admin/users/status`

Activate or deactivate a user.

| Field | Type | Required |
|-------|------|----------|
| userId | string | yes |
| isActive | boolean | yes |

**Example:**
```json
{ "userId": "64a1b2c3...", "isActive": false }
```

---

## Workers

### 8. GET `/api/admin/workers?page=1&limit=15&search=<query>`

List all worker profiles (paginated).

#### Query Params

| Param | Default | Notes |
|-------|---------|-------|
| page | 1 | |
| limit | 15 | |
| search | — | Filter by verification status |

#### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "user": {
        "_id": "...",
        "name": "worker",
        "email": "worker@worker.com",
        "phone": "9876543211",
        "isActive": true,
        "avatarUrl": null
      },
      "isOnline": false,
      "skills": ["plumbing"],
      "avgRating": 0,
      "totalJobs": 0,
      "verificationStatus": "PENDING",
      "creditEligibility": "NOT_ELIGIBLE",
      "createdAt": "2026-06-19T20:12:29Z"
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 1, "pages": 1 }
}
```

---

### 9. GET `/api/admin/workers/:id`

Get a single worker's full profile.

---

### 10. GET `/api/admin/workers/:id/kyc`

Get a worker's KYC documents and verification status.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "verificationStatus": "PENDING",
    "documents": [
      {
        "_id": "...",
        "documentType": "AADHAAR",
        "documentUrl": "https://...",
        "documentNumber": "1234-****-9012",
        "status": "SUBMITTED"
      }
    ]
  }
}
```

---

### 11. DELETE `/api/admin/workers/:id`

Deactivate a worker. Sets user `isActive=false` and removes the WorkerProfile.

**Params:** `id` — User ID of the worker

---

### 12. GET `/api/admin/workers/pending-verification?page=1&limit=15`

List workers with `verificationStatus: PENDING`.

---

### 13. POST `/api/admin/verify-worker`

Verify or reject a worker's KYC.

| Field | Type | Required |
|-------|------|----------|
| workerId | string | yes | User ID |
| status | string | yes | `VERIFIED`, `REJECTED`, `PENDING` |

**Example:**
```json
{ "workerId": "64a1b2c3...", "status": "VERIFIED" }
```

---

### 14. POST `/api/admin/workers/bulk-verify`

Bulk verify KYC documents.

| Field | Type | Required |
|-------|------|----------|
| documentIds | string[] | yes | Array of WorkerKYC document IDs |
| status | string | yes | `VERIFIED` or `REJECTED` |

**Example:**
```json
{
  "documentIds": ["64c1...", "64c2..."],
  "status": "VERIFIED"
}
```

---

## Operations

### 15. GET `/api/admin/operations/live`

Live operations dashboard.

#### Response (200)
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

### 16. GET `/api/admin/disputes?page=1&limit=15`

List cancelled/charged jobs.

---

### 17. GET `/api/admin/complaints?status=OPEN&page=1&limit=15`

List complaints.

#### Query Params

| Param | Default | Notes |
|-------|---------|-------|
| status | — | `OPEN`, `IN_PROGRESS`, `RESOLVED` |
| page | 1 | |
| limit | 15 | |

---

### 18. POST `/api/admin/complaints/:id/resolve`

Resolve a complaint.

| Field | Type | Required |
|-------|------|----------|
| resolution | string | yes |
| refundAmount | number | no |

**Example:**
```json
{
  "resolution": "Full refund issued to customer",
  "refundAmount": 500
}
```

---

## Services — Categories

### 19. GET `/api/admin/services/categories?page=1&limit=15`

---

### 20. POST `/api/admin/services/categories`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | min 2 chars |
| slug | string | yes | lowercase alphanumeric + hyphens |
| icon | string | no | Emoji |
| description | string | no | |
| isActive | boolean | no | default `true` |
| sortOrder | number | no | default `0` |

**Example:**
```json
{
  "name": "Plumbing",
  "slug": "plumbing",
  "icon": "🔧",
  "description": "All plumbing services",
  "sortOrder": 1
}
```

---

### 21. PATCH `/api/admin/services/categories/:id`

All fields optional.

---

### 22. DELETE `/api/admin/services/categories/:id`

---

## Services — Sub-Services

### 23. GET `/api/admin/services/sub-services?categoryId=<id>`

---

### 24. POST `/api/admin/services/sub-services`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | |
| slug | string | yes | |
| category | string | yes | Category ObjectId |
| description | string | no | |
| basePrice | number | yes | >= 0 |
| estimatedTime | number | yes | Minutes, >= 1 |
| pricingType | string | no | `FIXED` or `ESTIMATE` (default) |
| isActive | boolean | no | default `true` |

**Example:**
```json
{
  "name": "Water Leakage",
  "slug": "water-leakage",
  "category": "64b2c3d4...",
  "description": "Fix water leakage in pipes",
  "basePrice": 299,
  "estimatedTime": 60,
  "pricingType": "ESTIMATE"
}
```

---

### 25. PATCH `/api/admin/services/sub-services/:id`

All fields optional.

---

### 26. DELETE `/api/admin/services/sub-services/:id`

---

## Banners

### 27. GET `/api/admin/banners?page=1&limit=15`

---

### 28. POST `/api/admin/banners`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | yes | |
| subtitle | string | no | |
| imageUrl | string | no | Banner image URL |
| linkUrl | string | no | Deep link target |
| type | string | yes | `PROMOTION`, `ANNOUNCEMENT`, `COUPON`, `INFO` |
| isActive | boolean | no | default `true` |
| sortOrder | number | no | default `0` |
| startsAt | string | no | ISO date — when to start showing |
| expiresAt | string | no | ISO date — when to stop showing |

**Example:**
```json
{
  "title": "Monsoon Mega Sale",
  "subtitle": "20% off on all plumbing services",
  "imageUrl": "https://cloudinary.com/.../banner.jpg",
  "linkUrl": "/services/plumbing",
  "type": "PROMOTION",
  "startsAt": "2026-07-01",
  "expiresAt": "2026-07-31"
}
```

---

### 29. PATCH `/api/admin/banners/:id`

All fields optional.

---

### 30. DELETE `/api/admin/banners/:id`

---

## Coupons

### 31. GET `/api/admin/coupons?page=1&limit=15`

---

### 32. POST `/api/admin/coupons`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | string | yes | 3-20 chars, unique |
| description | string | yes | |
| type | string | yes | `PERCENTAGE`, `FLAT`, `FREE_DELIVERY` |
| value | number | yes | >= 0 |
| minOrderAmount | number | no | Minimum order for coupon to apply |
| maxDiscount | number | no | Cap for percentage discounts |
| usageLimit | number | no | Total uses allowed |
| perUserLimit | number | no | Uses per user |
| applicableCategories | string[] | no | Category ObjectIds |
| isActive | boolean | no | default `true` |
| startsAt | string | no | ISO date |
| expiresAt | string | no | ISO date |

**Example:**
```json
{
  "code": "SUMMER10",
  "description": "10% off on all services",
  "type": "PERCENTAGE",
  "value": 10,
  "minOrderAmount": 500,
  "maxDiscount": 200,
  "usageLimit": 100,
  "perUserLimit": 3
}
```

---

### 33. PATCH `/api/admin/coupons/:id`

All fields optional. Pass `null` to clear optional fields like `minOrderAmount`.

---

### 34. DELETE `/api/admin/coupons/:id`

---

## Public Endpoints (Admin-owned but user-facing)

### 35. GET `/api/services/banners/active`

Returns active banners for the home page. No auth needed.

---

### 36. POST `/api/coupons/validate`

Validate a coupon code. Requires any logged-in user. (See [USER.md](./USER.md#11-post-apicouponsvalidate))
