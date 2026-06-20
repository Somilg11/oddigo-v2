# Worker API

**Base URL:** `/api/workers`
**Auth Required:** Yes — `Authorization: Bearer <token>` (WORKER role only)

---

## Profile

### 1. GET `/api/workers/me`

Get the worker's profile and stats.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "64b2c3d4...",
    "user": {
      "_id": "64a1b2c3...",
      "name": "worker",
      "email": "worker@worker.com",
      "phone": "9876543211",
      "isActive": true,
      "avatarUrl": null
    },
    "isOnline": false,
    "lastLocation": {
      "type": "Point",
      "coordinates": [77.3910, 28.5355]
    },
    "wilsonScore": 0,
    "reliabilityScore": 0,
    "totalJobs": 0,
    "onTimeJobs": 0,
    "avgRating": 0,
    "skills": ["plumbing"],
    "creditEligibility": "NOT_ELIGIBLE",
    "verificationStatus": "PENDING",
    "createdAt": "2026-06-19T20:12:29.383Z"
  }
}
```

---

### 2. POST `/api/workers/onboarding`

Update worker profile fields. Accepts any `IWorkerProfile` field via `$set`.

| Field | Type | Notes |
|-------|------|-------|
| skills | string[] | e.g. `["plumbing", "electrical"]` |
| creditEligibility | string | `ELIGIBLE` or `NOT_ELIGIBLE` |
| verificationStatus | string | `PENDING`, `VERIFIED`, `REJECTED` |

**Example:**
```json
{
  "skills": ["plumbing", "electrical"],
  "creditEligibility": "ELIGIBLE"
}
```

#### Response (200)
Updated WorkerProfile object.

---

## Availability

### 3. POST `/api/workers/availability`

Go online or offline to receive job offers.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| isOnline | boolean | yes | `true` = available for jobs |
| location | object | no | `{ lat: 28.5355, long: 77.3910 }` |

**Example:**
```json
{
  "isOnline": true,
  "location": { "lat": 28.5355, "long": 77.3910 }
}
```

**Side effects:**
- Updates Redis GEO index for location-based matching
- Worker appears/disappears from nearby customer searches

---

### 4. GET `/api/workers/stats`

Get earnings and job statistics.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "totalJobs": 15,
    "completedJobs": 12,
    "onTimeJobs": 11,
    "avgRating": 4.5,
    "wilsonScore": 0.85,
    "totalEarnings": 18500,
    "monthlyEarnings": 5200
  }
}
```

---

## KYC (Know Your Customer)

### 5. POST `/api/workers/kyc/upload`

Upload a KYC document.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| documentType | string | yes | See enum values below |
| documentUrl | string | yes | Cloudinary URL of the document |
| documentNumber | string | no | e.g. Aadhaar number, PAN number |

**Document types:** `AADHAAR`, `PAN`, `BANK_DETAILS`, `SKILL_TEST`, `POLICE_VERIFICATION`

**Example:**
```json
{
  "documentType": "AADHAAR",
  "documentUrl": "https://res.cloudinary.com/.../aadhaar.jpg",
  "documentNumber": "1234-5678-9012"
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "documentType": "AADHAAR",
    "documentUrl": "https://res.cloudinary.com/.../aadhaar.jpg",
    "documentNumber": "1234-5678-9012",
    "status": "PENDING",
    "createdAt": "2026-06-20T10:00:00Z"
  }
}
```

---

### 6. POST `/api/workers/kyc/submit`

Submit all uploaded KYC documents for verification. No body needed.

**Prerequisite:** At least one KYC document must be uploaded.

**Side effect:** Sets `WorkerProfile.verificationStatus` to `PENDING`.

#### Response (200)
```json
{
  "success": true,
  "message": "KYC documents submitted for verification"
}
```

---

### 7. GET `/api/workers/kyc`

Get KYC status and uploaded documents.

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
        "status": "SUBMITTED",
        "submittedAt": "2026-06-20T10:00:00Z"
      }
    ]
  }
}
```

---

## Worker Jobs

Worker also has access to job endpoints (see [JOB.md](./JOB.md)) with worker-specific actions:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs/:id/accept` | POST | Accept a job offer |
| `/api/jobs/:id/start` | PATCH | Mark job as started |
| `/api/jobs/:id/request-otp` | POST | Request OTP from customer |
| `/api/jobs/:id/verify-otp` | POST | Verify OTP — `{ "otp": "123456" }` |
| `/api/jobs/:id/estimate` | POST | Submit cost estimate |
| `/api/jobs/:id/before-photo` | POST | Upload before photo — `{ "photoUrl": "..." }` |
| `/api/jobs/:id/after-photo` | POST | Upload after photo — `{ "photoUrl": "..." }` |
| `/api/jobs/:id/complete` | POST | Complete job — `{ "proofUrl": "...", "customerSignature": "..." }` |
| `/api/jobs/:id/amendment` | POST | Request scope creep amendment |
| `/api/jobs/history` | GET | Get worker's job history |
| `/api/jobs/:id` | GET | Get job details |

---

## Maintenance Mode

If maintenance is enabled for the worker app, all worker endpoints return:

```json
{
  "success": false,
  "status": "fail",
  "message": "Worker app is under maintenance"
}
```

**HTTP Status:** 503
