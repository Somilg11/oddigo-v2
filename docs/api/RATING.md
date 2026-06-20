# Rating API

**Base URL:** `/api/ratings`
**Auth Required:** Yes

---

## 1. POST `/api/ratings/jobs/:id/rate`

Rate a completed job. Customer only.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| rating | number | yes | 1-5 |
| review | string | no | Text review |

**Example:**
```json
{
  "rating": 5,
  "review": "Excellent work! Very professional."
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "job": "...",
    "customer": "...",
    "worker": "...",
    "rating": 5,
    "review": "Excellent work! Very professional.",
    "createdAt": "2026-06-20T12:00:00Z"
  }
}
```

**Side effects:**
- Updates `WorkerProfile.avgRating` and `totalJobs`
- If rating is 5, awards 50 bonus points to the worker

---

## 2. GET `/api/ratings/workers/:id/ratings?page=1&limit=15`

Get paginated ratings for a worker.

**Params:** `id` — WorkerProfile ID or User ID

#### Query Params

| Param | Default |
|-------|---------|
| page | 1 |
| limit | 15 |

#### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "rating": 5,
      "review": "Excellent work!",
      "customer": { "name": "John D." },
      "createdAt": "2026-06-20T12:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 12, "pages": 1 }
}
```
