# Zone Manager API

**Base URL:** `/api/zone-manager`
**Auth Required:** Yes — `Authorization: Bearer <token>` (ZONE_MANAGER role only)

---

## Zones

### 1. GET `/api/zone-manager/zones`

List all zones assigned to this zone manager.

#### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Sector 137",
      "city": "Noida",
      "center": { "type": "Point", "coordinates": [77.3910, 28.5355] },
      "radiusKm": 5,
      "assignedTo": "...",
      "createdAt": "2026-06-19T00:00:00Z"
    }
  ]
}
```

---

### 2. GET `/api/zone-manager/zones/:id/stats`

Get zone analytics (revenue, jobs, worker performance).

**Params:** `id` — Zone ObjectId

#### Response (200)
```json
{
  "success": true,
  "data": {
    "zone": { "name": "Sector 137" },
    "totalJobs": 120,
    "completedJobs": 100,
    "cancelledJobs": 10,
    "totalRevenue": 45000,
    "avgRating": 4.3,
    "activeWorkers": 15,
    "avgCompletionTime": 45
  }
}
```

---

### 3. GET `/api/zone-manager/zones/:id/supply-demand`

Get worker supply vs job demand for a zone.

**Params:** `id` — Zone ObjectId

#### Response (200)
```json
{
  "success": true,
  "data": {
    "zone": { "name": "Sector 137" },
    "supply": {
      "online": 10,
      "busy": 5,
      "available": 5
    },
    "demand": {
      "pendingRequests": 15,
      "last24h": {
        "created": 20,
        "completed": 15,
        "cancelled": 3
      }
    },
    "ratio": 3,
    "needsRecruitment": true
  }
}
```

---

### 4. POST `/api/zone-manager/zones/:id/recruit`

Trigger recruitment for a specific skill gap.

**Params:** `id` — Zone ObjectId

| Field | Type | Required |
|-------|------|----------|
| skillNeeded | string | yes |
| countNeeded | number | yes |
| reason | string | no |

**Example:**
```json
{
  "skillNeeded": "electrician",
  "countNeeded": 10,
  "reason": "High demand in sector 137, 3:1 demand-supply ratio"
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "zone": "Sector 137",
    "skill": "electrician",
    "count": 10,
    "recruitmentTriggered": true
  }
}
```
