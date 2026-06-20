# User API

**Base URL:** `/api/users`
**Auth Required:** Yes — `Authorization: Bearer <token>` (any logged-in user)

---

## Profile

### 1. GET `/api/users/me`

Get current user profile including addresses and referral info.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "role": "CUSTOMER",
    "gender": "MALE",
    "dateOfBirth": "1995-06-15T00:00:00.000Z",
    "avatarUrl": "https://cloudinary.com/...",
    "referralCode": "JOHN1X7K",
    "creditStatus": "GREEN",
    "monthlyJobsCount": 2,
    "isActive": true,
    "addresses": [
      {
        "_id": "64b2c3d4...",
        "label": "HOME",
        "street": "123 Main St",
        "city": "Noida",
        "state": "UP",
        "pincode": "201301",
        "landmark": "Near sector 62",
        "coordinates": [77.3910, 28.5355],
        "isDefault": true
      }
    ],
    "createdAt": "2026-06-19T19:32:28.767Z"
  }
}
```

---

### 2. PATCH `/api/users/me`

Update profile. Only these fields are allowed:

| Field | Type | Notes |
|-------|------|-------|
| name | string | |
| email | string | |
| phone | string | |
| avatarUrl | string | Cloudinary URL |
| gender | string | `MALE`, `FEMALE`, `OTHER` |
| dateOfBirth | string | ISO date e.g. `"1995-06-15"` |

**Example:**
```json
{
  "name": "Johnathan Doe",
  "gender": "MALE",
  "dateOfBirth": "1995-06-15"
}
```

#### Response (200)
Updated user object.

---

## Addresses

### 3. POST `/api/users/addresses`

Add a new address.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| label | string | yes | `HOME`, `WORK`, `OTHER` |
| street | string | yes | Full street address |
| city | string | yes | |
| state | string | yes | |
| pincode | string | yes | |
| landmark | string | no | Nearby landmark |
| coordinates | number[] | no | `[longitude, latitude]` |
| isDefault | boolean | no | Set as default address |

**Example:**
```json
{
  "label": "HOME",
  "street": "123 Main St, Sector 62",
  "city": "Noida",
  "state": "Uttar Pradesh",
  "pincode": "201301",
  "landmark": "Near Fortis Hospital",
  "coordinates": [77.3910, 28.5355],
  "isDefault": true
}
```

#### Response (200)
Updated user with full addresses array.

---

### 4. PATCH `/api/users/addresses/:id`

Update an existing address. Same fields as add, all optional.

**Params:** `id` — address subdocument ID

---

### 5. DELETE `/api/users/addresses/:id`

Remove an address.

**Params:** `id` — address subdocument ID

---

### 6. PATCH `/api/users/addresses/:id/default`

Set an address as the default. No body needed.

**Params:** `id` — address subdocument ID

---

## Points

### 7. GET `/api/users/me/points`

Get points balance for the current user.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "balance": 3000,
    "lifetimeEarned": 5000,
    "lifetimeRedeemed": 2000,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 8. GET `/api/users/me/points/history?page=1&limit=15`

Get paginated points transaction history.

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
      "user": "...",
      "type": "EARNED",
      "points": 1000,
      "sourceModel": "Job",
      "sourceId": "...",
      "description": "First booking bonus",
      "createdAt": "2026-06-20T10:00:00.000Z"
    },
    {
      "_id": "...",
      "type": "REDEEMED",
      "points": -500,
      "description": "Discount on job #...",
      "createdAt": "2026-06-20T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 3,
    "pages": 1
  }
}
```

**Transaction types:** `EARNED`, `REDEEMED`, `EXPIRED`, `ADJUSTED`

**Points earned on:**
- First booking: 1,000 pts (₹10)
- Job completion: 100 pts per ₹1 spent (100 pts = ₹1)
- 5-star rating: 50 pts (₹0.50)
- Referral signup: 2,000 pts (₹20)
- Referral first job: 2,000 pts (₹20)

---

## Referral

### 9. GET `/api/users/me/referral`

Get referral code and stats for the current user.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "referralCode": "JOHN1X7K",
    "totalPointsEarnedFromReferrals": 4000,
    "referredUsers": [
      {
        "name": "Jane",
        "createdAt": "2026-06-20T08:00:00.000Z",
        "bonusAwarded": true
      }
    ]
  }
}
```

---

### 10. GET `/api/users/referral/lookup/:code`

Public endpoint — validate a referral code.

**Params:** `code` — 8-char referral code

#### Response (200)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "referrerName": "John D.",
    "bonusPoints": 2000
  }
}
```

---

## Coupons

### 11. POST `/api/coupons/validate`

Validate a coupon code before applying to a job.

| Field | Type | Required |
|-------|------|----------|
| code | string | yes |
| jobAmount | number | no | For percentage discount calculation |
| categoryId | string | no | To check applicable categories |

**Example:**
```json
{
  "code": "SUMMER10",
  "jobAmount": 1500,
  "categoryId": "..."
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "maxDiscount": 200,
    "message": "10% off, max ₹200"
  }
}
```

---

## Notifications

### 12. GET `/api/notifications?page=1&limit=15`

Get user's notifications (paginated).

#### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "job:offer",
      "title": "New Job Offer!",
      "message": "New plumbing job available near you",
      "isRead": false,
      "createdAt": "2026-06-20T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 8, "pages": 1 }
}
```

---

### 13. PATCH `/api/notifications/:id/read`

Mark a notification as read. No body needed.

#### Response (200)
```json
{ "success": true, "message": "Marked as read" }
```
