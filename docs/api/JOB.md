# Job Lifecycle API

**Base URL:** `/api/jobs`
**Auth Required:** Yes — `Authorization: Bearer <token>` (any logged-in user)

> Customer and Worker endpoints are mixed in this file. Auth is enforced per-route in the service layer.

---

## Job Status Flow

```
CREATED → MATCHING → ACCEPTED → IN_PROGRESS → OTP_PENDING → IN_PROGRESS
  → ON_SITE_DIAGNOSIS → FINAL_APPROVAL_PENDING → REPAIR_IN_PROGRESS
  → COMPLETED → PAYMENT_PENDING → PAID → RATED
```

**Cancellation:** `CREATED`/`MATCHING` → `CANCELLED` (by customer)
**Amendment rejected:** → `CANCELLED_CHARGED`

---

## Customer Endpoints

### 1. POST `/api/jobs/estimate`

Get a price estimate before booking.

| Field | Type | Required |
|-------|------|----------|
| serviceType | string | yes |
| lat | number | yes |
| long | number | yes |
| subServiceId | string | no |

**Example:**
```json
{
  "serviceType": "water-leakage",
  "lat": 28.5355,
  "long": 77.3910,
  "subServiceId": "64b2c3d4..."
}
```

#### Response (200)
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

### 2. POST `/api/jobs`

Create a new job booking.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| location | object | yes | `{ type: "Point", coordinates: [lng, lat] }` |
| serviceType | string | yes | Service slug |
| subService | string | no | Sub-service ObjectId |
| subServiceName | string | no | Human-readable name |
| couponCode | string | no | Valid coupon code |
| notes | string | no | |
| photos | string[] | no | Issue photos |
| videos | string[] | no | Issue videos |
| customIssue | string | no | Free-text description |

**Example:**
```json
{
  "serviceType": "water-leakage",
  "subService": "64b2c3d4...",
  "subServiceName": "Water Leakage",
  "location": {
    "type": "Point",
    "coordinates": [77.3910, 28.5355]
  },
  "couponCode": "SUMMER10",
  "customIssue": "Water leaking from kitchen pipe under sink"
}
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "64c3d4e5...",
    "status": "CREATED",
    "serviceType": "water-leakage",
    "initialQuote": 388,
    "visitFee": 99,
    "couponCode": "SUMMER10",
    "discount": 39,
    "customer": "...",
    "createdAt": "2026-06-20T10:00:00.000Z"
  }
}
```

---

### 3. GET `/api/jobs/history?page=1&limit=15`

Get paginated job history for the current user.

#### Query Params

| Param | Default | Notes |
|-------|---------|-------|
| page | 1 | Page number |
| limit | 15 | Items per page |

#### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "status": "COMPLETED",
      "serviceType": "water-leakage",
      "initialQuote": 388,
      "finalQuote": 449,
      "worker": { "name": "worker", "avgRating": 4.5 },
      "createdAt": "2026-06-20T10:00:00Z",
      "completedAt": "2026-06-20T12:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 5, "pages": 1 }
}
```

---

### 4. GET `/api/jobs/:id`

Get full details of a single job.

---

### 5. POST `/api/jobs/:id/cancel`

Cancel a job. No body. Only works when status is `CREATED` or `MATCHING`.

---

### 6. POST `/api/jobs/:id/find-workers`

Trigger the worker matching engine. No body.

**Side effect:** Queries Redis GEO index for nearby online workers, sends job offers via WebSocket.

---

### 7. PATCH `/api/jobs/:id/final-approval`

Approve or reject the worker's final price estimate.

| Field | Type | Required |
|-------|------|----------|
| approved | boolean | yes |

**Example:**
```json
{ "approved": true }
```

---

### 8. PATCH `/api/jobs/:id/amendment`

Respond to a worker's scope creep amendment request.

| Field | Type | Required |
|-------|------|----------|
| approved | boolean | yes |

---

### 9. POST `/api/jobs/:id/signature`

Submit digital signature after job completion.

| Field | Type | Required |
|-------|------|----------|
| signatureData | string | yes | Base64 image data |

---

### 10. POST `/api/jobs/:id/pay`

Initiate payment for a completed job.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentMethod | string | yes | `UPI`, `CARD`, `CASH`, `WALLET` |

**Example:**
```json
{ "paymentMethod": "UPI" }
```

---

### 11. POST `/api/jobs/:id/pay/confirm`

Confirm Razorpay payment (for online payments).

| Field | Type | Required |
|-------|------|----------|
| razorpay_order_id | string | yes |
| razorpay_payment_id | string | yes |
| razorpay_signature | string | yes |

---

### 12. POST `/api/jobs/:id/refund`

Admin refunds a job. (Called from admin panel.)

| Field | Type | Required |
|-------|------|----------|
| reason | string | yes |

---

## Worker Endpoints

### 13. POST `/api/jobs/:id/accept`

Worker accepts a job offer. No body.

**Status transition:** `MATCHING` → `ACCEPTED`

---

### 14. PATCH `/api/jobs/:id/start`

Worker marks job as started (arrived at location). No body.

**Status transition:** `ACCEPTED` → `IN_PROGRESS`

---

### 15. POST `/api/jobs/:id/request-otp`

Worker requests OTP from customer for verification. No body.

**Side effect:** Generates 6-digit OTP, sends to customer via WebSocket + notification.

---

### 16. POST `/api/jobs/:id/verify-otp`

Worker verifies the OTP.

| Field | Type | Required |
|-------|------|----------|
| otp | string | yes | 6-digit code |

**Example:**
```json
{ "otp": "123456" }
```

---

### 17. POST `/api/jobs/:id/estimate`

Worker submits a cost estimate.

| Field | Type | Required |
|-------|------|----------|
| visitCharge | number | yes |
| labourCost | number | yes |
| partsCost | number | yes |
| notes | string | no |

**Example:**
```json
{
  "visitCharge": 99,
  "labourCost": 300,
  "partsCost": 150,
  "notes": "Need to replace washer and tighten connections"
}
```

---

### 18. POST `/api/jobs/:id/before-photo`

Worker uploads a before photo.

| Field | Type | Required |
|-------|------|----------|
| photoUrl | string | yes | Cloudinary URL |

---

### 19. POST `/api/jobs/:id/after-photo`

Worker uploads an after photo.

| Field | Type | Required |
|-------|------|----------|
| photoUrl | string | yes | Cloudinary URL |

---

### 20. POST `/api/jobs/:id/complete`

Worker completes the job.

| Field | Type | Required |
|-------|------|----------|
| proofUrl | string | yes | After photo URL |
| customerSignature | string | no | Base64 signature |

**Side effects:**
- Sets status to `COMPLETED`
- Awards job completion points (100 pts per ₹1 spent)
- Awards 50 bonus points if customer rates 5 stars

---

### 21. POST `/api/jobs/:id/amendment`

Worker requests scope creep amendment.

| Field | Type | Required |
|-------|------|----------|
| reason | string | yes |
| proposedAmount | number | yes |
| evidenceUrl | string | yes | Photo of additional work needed |

**Example:**
```json
{
  "reason": "Additional pipe replacement needed beyond original scope",
  "proposedAmount": 800,
  "evidenceUrl": "https://cloudinary.com/.../evidence.jpg"
}
```
