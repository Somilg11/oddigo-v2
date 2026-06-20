# Warranty API

**Base URL:** `/api/warranty`
**Auth Required:** Yes

---

## 1. POST `/api/warranty/:jobId/claim`

File a warranty claim for a completed job.

| Field | Type | Required |
|-------|------|----------|
| description | string | yes |
| photos | string[] | no | Array of image URLs |

**Example:**
```json
{
  "description": "The leak reoccurred after 3 days of the repair",
  "photos": ["https://cloudinary.com/.../photo1.jpg"]
}
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "job": "...",
    "customer": "...",
    "description": "The leak reoccurred after 3 days",
    "photos": ["https://..."],
    "status": "PENDING",
    "createdAt": "2026-06-20T12:00:00Z"
  }
}
```

---

## 2. GET `/api/warranty/:jobId/status`

Check warranty status for a job.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "hasWarranty": true,
    "warrantyExpiry": "2026-12-20T00:00:00Z",
    "claim": {
      "_id": "...",
      "status": "PENDING",
      "description": "Leak reoccurred",
      "createdAt": "2026-06-20T12:00:00Z"
    }
  }
}
```

---

## 3. PATCH `/api/warranty/:claimId/resolve`

Resolve a warranty claim. **Admin only.**

| Field | Type | Required |
|-------|------|----------|
| status | string | yes | `APPROVED`, `REJECTED`, `RESOLVED` |
| adminNotes | string | no |

**Example:**
```json
{
  "status": "APPROVED",
  "adminNotes": "Worker dispatched for re-repair at no extra cost"
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "APPROVED",
    "adminNotes": "Worker dispatched for re-repair",
    "resolvedAt": "2026-06-20T14:00:00Z"
  }
}
```
