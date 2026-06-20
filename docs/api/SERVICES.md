# Services API (Public)

**Base URL:** `/api/services`
**Auth Required:** No (all endpoints are public)

---

## 1. GET `/api/services/categories`

List all active service categories.

#### Response (200)
```json
{
  "success": true,
  "results": 4,
  "data": [
    {
      "_id": "64b2c3d4...",
      "name": "Plumbing",
      "slug": "plumbing",
      "icon": "🔧",
      "description": "All plumbing repair and installation services",
      "isActive": true,
      "sortOrder": 0,
      "createdAt": "2026-06-19T00:00:00Z"
    },
    {
      "_id": "...",
      "name": "Electrical Appliances",
      "slug": "electrical-appliances",
      "icon": "⚡",
      "description": "Fan, light, switch, and wiring repairs"
    }
  ]
}
```

---

## 2. GET `/api/services/sub-services?categoryId=<id>`

List sub-services. Optionally filter by category.

#### Query Params

| Param | Required | Notes |
|-------|----------|-------|
| categoryId | no | Filter by parent category ObjectId |

#### Response (200)
```json
{
  "success": true,
  "results": 6,
  "data": [
    {
      "_id": "64b2c3d4...",
      "name": "Water Leakage",
      "slug": "water-leakage",
      "category": {
        "_id": "...",
        "name": "Plumbing",
        "slug": "plumbing",
        "icon": "🔧"
      },
      "description": "Fix water leakage in pipes and joints",
      "basePrice": 299,
      "estimatedTime": 60,
      "pricingType": "ESTIMATE",
      "isActive": true,
      "createdAt": "2026-06-19T00:00:00Z"
    }
  ]
}
```

---

## 3. GET `/api/services/sub-services/:id`

Get a single sub-service by ID.

**Params:** `id` — Sub-service ObjectId

#### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Water Leakage",
    "slug": "water-leakage",
    "category": { "_id": "...", "name": "Plumbing" },
    "basePrice": 299,
    "estimatedTime": 60,
    "pricingType": "ESTIMATE"
  }
}
```

---

## 4. GET `/api/services/banners/active`

Returns currently active banners for the home page carousel.

Filters by: `isActive: true`, `startsAt <= now`, `expiresAt > now` (or null). Returns sorted by `sortOrder`.

#### Response (200)
```json
{
  "success": true,
  "results": 2,
  "data": [
    {
      "_id": "...",
      "title": "Monsoon Mega Sale",
      "subtitle": "20% off plumbing",
      "imageUrl": "https://cloudinary.com/.../banner.jpg",
      "linkUrl": "/services/plumbing",
      "type": "PROMOTION",
      "sortOrder": 0
    }
  ]
}
```
