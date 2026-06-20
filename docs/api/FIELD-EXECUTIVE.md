# Field Executive API

**Base URL:** `/api/field-executive`
**Auth Required:** Yes — `Authorization: Bearer <token>` (FIELD_EXECUTIVE role only)

---

## Workers

### 1. GET `/api/field-executive/workers`

List all workers assigned to this field executive.

#### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "user": { "name": "worker", "email": "worker@worker.com" },
      "skills": ["plumbing"],
      "avgRating": 4.2,
      "totalJobs": 15,
      "verificationStatus": "VERIFIED",
      "isOnline": true
    }
  ]
}
```

---

### 2. GET `/api/field-executive/worker/:id/status`

Check a specific worker's status.

**Params:** `id` — WorkerProfile ID

#### Response (200)
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "lastLocation": { "lat": 28.5355, "long": 77.3910 },
    "totalJobs": 15,
    "completedJobs": 12,
    "avgRating": 4.2,
    "recentVisits": [...]
  }
}
```

---

## Field Visits

### 3. POST `/api/field-executive/worker/:id/visit`

Log a field visit to a worker.

**Params:** `id` — WorkerProfile ID

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string | yes | `CHECK_IN`, `FOLLOW_UP`, `QUALITY_AUDIT`, `COMPLAINT_HANDLE` |
| notes | string | yes | Visit notes |
| photos | string[] | no | Array of image URLs |
| location | object | no | `{ lat, long }` |

**Example:**
```json
{
  "type": "CHECK_IN",
  "notes": "Routine monthly check-in. Worker is performing well.",
  "photos": ["https://cloudinary.com/.../photo1.jpg"],
  "location": { "lat": 28.5355, "long": 77.3910 }
}
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "worker": "...",
    "fieldExecutive": "...",
    "type": "CHECK_IN",
    "notes": "Routine monthly check-in",
    "photos": ["https://..."],
    "location": { "type": "Point", "coordinates": [77.3910, 28.5355] },
    "createdAt": "2026-06-20T10:00:00Z"
  }
}
```

---

## Quality Audit

### 4. GET `/api/field-executive/quality-audit?page=1&limit=15`

Get paginated list of quality audits.

#### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "job": { "_id": "...", "serviceType": "water-leakage" },
      "hasBeforePhotos": true,
      "hasAfterPhotos": true,
      "invoiceValid": true,
      "notes": "All checks passed",
      "createdAt": "2026-06-20T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 5, "pages": 1 }
}
```

---

### 5. POST `/api/field-executive/quality-audit/:jobId`

Submit a quality audit for a job.

**Params:** `jobId` — Job ObjectId

| Field | Type | Required |
|-------|------|----------|
| hasBeforePhotos | boolean | yes |
| hasAfterPhotos | boolean | yes |
| invoiceValid | boolean | yes |
| notes | string | no |

**Example:**
```json
{
  "hasBeforePhotos": true,
  "hasAfterPhotos": true,
  "invoiceValid": true,
  "notes": "Documentation complete, invoice matches estimate"
}
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "job": "...",
    "auditedBy": "...",
    "hasBeforePhotos": true,
    "hasAfterPhotos": true,
    "invoiceValid": true,
    "notes": "Documentation complete",
    "createdAt": "2026-06-20T10:00:00Z"
  }
}
```
