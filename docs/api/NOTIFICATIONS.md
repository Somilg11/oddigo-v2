# Notification API

**Base URL:** `/api/notifications`
**Auth Required:** Yes (any logged-in user)

---

## 1. GET `/api/notifications?page=1&limit=15`

Get paginated notifications for the current user.

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
      "_id": "60d...",
      "type": "job:offer",
      "title": "New Job Offer!",
      "message": "New plumbing job available near sector 62",
      "isRead": false,
      "data": { "jobId": "..." },
      "createdAt": "2026-06-20T10:00:00Z"
    },
    {
      "_id": "60d...",
      "type": "kyc:approved",
      "title": "KYC Approved",
      "message": "Your documents have been verified",
      "isRead": true,
      "createdAt": "2026-06-20T08:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 8, "pages": 1 }
}
```

**Notification types:** `job:offer`, `job:assigned`, `job:completed`, `job:cancelled`, `kyc:approved`, `kyc:rejected`, `payment:received`, `warranty:issued`

---

## 2. PATCH `/api/notifications/:id/read`

Mark a single notification as read. No body needed.

#### Response (200)
```json
{
  "success": true,
  "message": "Marked as read"
}
```
