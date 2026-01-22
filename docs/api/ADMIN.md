# Admin API

## Overview
Base URL: `/api/admin`

Endpoints for system administration, monitoring, and analytics.
**Role Required**: `ADMIN`

## Endpoints

### 1. System Health
Check status of all external providers (Stripe, Email, OTP).

- **URL**: `/health`
- **Method**: `GET`
- **Auth Required**: Yes (Admin)

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "services": [
      { "service": "Email (SMTP)", "status": "UP", "latency": 150 },
      { "service": "OTP Service (Redis)", "status": "UP", "latency": 5 },
      { "service": "Stripe", "status": "UP", "latency": 200 }
    ],
    "maintenance": {
      "userApp": false,
      "workerApp": false
    }
  }
}
```

### 2. Toggle Maintenance Mode
Enable or disable maintenance mode for apps.

- **URL**: `/maintenance`
- **Method**: `POST`
- **Auth Required**: Yes (Admin)

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `app` | string | Yes | `USER` or `WORKER` |
| `enabled` | boolean | Yes | `true` to block access |

**Example:**
```json
{
  "app": "USER",
  "enabled": true
}
```

### 3. Analytics
Get system-wide metrics.

- **URL**: `/analytics`
- **Method**: `GET`
- **Auth Required**: Yes (Admin)

#### Response
```json
{
  "data": {
    "totalUsers": 1250,
    "totalJobs": 450,
    "gmv": 15400.00
  }
}
```
