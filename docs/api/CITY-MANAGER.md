# City Manager API

**Base URL:** `/api/city-manager`
**Auth Required:** Yes — `Authorization: Bearer <token>` (CITY_MANAGER role only)

---

## Dashboard

### 1. GET `/api/city-manager/dashboard`

Get city-wide metrics.

#### Response (200)
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

---

## Zones

### 2. GET `/api/city-manager/zones`

List all zones in assigned cities.

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
      "workerCount": 15,
      "jobCount": 45
    }
  ]
}
```

---

### 3. POST `/api/city-manager/zones`

Create a new zone.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Zone name |
| city | string | yes | City name |
| center | object | yes | `{ lat, long }` |
| radiusKm | number | no | Default 5 |

**Example:**
```json
{
  "name": "Sector 62",
  "city": "Noida",
  "center": { "lat": 28.6280, "long": 77.3640 },
  "radiusKm": 3
}
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Sector 62",
    "city": "Noida",
    "center": { "type": "Point", "coordinates": [77.3640, 28.6280] },
    "radiusKm": 3,
    "assignedTo": "...",
    "createdAt": "2026-06-20T10:00:00Z"
  }
}
```

---

## Categories

### 4. POST `/api/city-manager/categories`

Add a new service category for the city.

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| slug | string | yes |
| icon | string | no |
| description | string | no |

**Example:**
```json
{
  "name": "Carpentry",
  "slug": "carpentry",
  "icon": "🪚",
  "description": "Woodwork and furniture repair"
}
```

---

## Campaigns

### 5. POST `/api/city-manager/campaigns`

Create a marketing campaign.

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| description | string | no |
| city | string | yes |
| discountPercent | number | no |
| discountCode | string | no |
| startDate | string | yes | ISO date |
| endDate | string | yes | ISO date |

**Example:**
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

#### Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Monsoon Sale",
    "city": "Noida",
    "discountPercent": 20,
    "discountCode": "MONSOON20",
    "startDate": "2026-07-01T00:00:00Z",
    "endDate": "2026-07-31T23:59:59Z",
    "createdBy": "...",
    "createdAt": "2026-06-20T10:00:00Z"
  }
}
```
