# Authentication API

## Overview
Base URL: `/api/auth`

Handles user registration, login, and token management. Uses JWT (Access + Refresh Tokens).

## Endpoints

### 1. Signup
Register a new customer or worker.

- **URL**: `/signup`
- **Method**: `POST`
- **Auth Required**: No

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Full name of the user |
| `email` | string | Yes | Unique email address |
| `phone` | string | Yes | Unique phone number |
| `password` | string | Yes | Strong password |
| `role` | string | Yes | `CUSTOMER` or `WORKER` |

**Example:**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "phone": "+15550123456",
  "password": "SecurePassword123!",
  "role": "CUSTOMER"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d5ec...",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "CUSTOMER",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### 2. Login
Authenticate existing user.

- **URL**: `/login`
- **Method**: `POST`
- **Auth Required**: No

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | Yes | Registered email |
| `password` | string | Yes | Password |

**Example:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePassword123!"
}
```

#### Response (200 OK)
Returns same structure as Signup (User object + Tokens).

## Error Codes
- `400`: Missing fields
- `401`: Invalid credentials
- `409`: Email/Phone already exists
