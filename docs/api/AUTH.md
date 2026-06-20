# Authentication API

**Base URL:** `/api/auth`
**Auth Required:** No (all endpoints)

---

## 1. POST `/api/auth/signup`

Register a new customer or worker.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Full name |
| email | string | yes | Unique email |
| phone | string | yes | Unique phone number |
| password | string | yes | Min 6 chars |
| role | string | yes | `CUSTOMER` or `WORKER` |
| serviceType | string | no | Worker only — skill slug e.g. `"plumbing"` |
| hourlyRate | number | no | Worker only |
| referralCode | string | no | 8-char code from an existing user for referral bonus |

**Example:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "securePassword123",
  "role": "CUSTOMER",
  "referralCode": "USER1RUQ"
}
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "role": "CUSTOMER",
      "referralCode": "JOHN1X7K",
      "creditStatus": "GREEN",
      "monthlyJobsCount": 0,
      "isActive": true,
      "addresses": [],
      "createdAt": "2026-06-20T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Side effects:**
- If `role: WORKER`, a `WorkerProfile` is auto-created
- If valid `referralCode` provided, referrer gets 2,000 points immediately
- A unique referral code (8 chars) is generated for the new user

---

## 2. POST `/api/auth/login`

Authenticate with email and password.

#### Request Body

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| password | string | yes |

**Example:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Response (200)
Same shape as signup — `user` object + `accessToken` + `refreshToken`.

---

## 3. POST `/api/auth/refresh-token`

Get new token pair when access token expires.

#### Request Body

| Field | Type | Required |
|-------|------|----------|
| refreshToken | string | yes |

**Example:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 4. POST `/api/auth/request-otp`

Request a one-time password for email-based login.

#### Request Body

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |

**Example:**
```json
{
  "email": "john@example.com"
}
```

#### Response (200)
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

---

## 5. POST `/api/auth/verify-otp`

Verify the OTP and receive tokens (same as login).

#### Request Body

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| code | string | yes | 6-digit OTP |

**Example:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

#### Response (200)
Same shape as login — `user` object + `accessToken` + `refreshToken`.

---

## Error Codes

| Status | Message |
|--------|---------|
| 400 | Missing required fields |
| 401 | Invalid credentials / Invalid OTP |
| 409 | Email or phone already exists |
| 429 | Too many signup attempts |
