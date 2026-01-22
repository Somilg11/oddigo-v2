# Worker API

## Overview
Base URL: `/api/workers`
**Role Required**: `WORKER`

## Endpoints

### 1. Onboarding (Create Profile)
Complete the initial worker setup.

- **URL**: `/onboarding`
- **Method**: `POST`

#### Request Body
```json
{
  "skills": ["plumbing", "electrical"],
  "experienceYears": 5,
  "vehicleType": "van"
}
```

### 2. Get Profile
Fetch worker-specific stats and profile.

- **URL**: `/profile`
- **Method**: `GET`

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "rating": 4.8,
    "wilsonScore": 0.92,
    "totalJobs": 45,
    "skills": ["plumbing"]
  }
}
```

### 3. Toggle Availability
Go Online or Offline to receive jobs.

- **URL**: `/availability`
- **Method**: `PATCH`

#### Request Body
```json
{
  "isOnline": true,
  "location": {
    "lat": 40.7128,
    "long": -74.0060
  }
}
```
**Side Effect**: Updates Redis Worker Geo-Index.
**Note**: Fails with 403 if `verificationStatus` is not `VERIFIED`.

### 4. Get Dashboard Stats
Get earnings and completion info.

- **URL**: `/stats`
- **Method**: `GET`

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "rating": 4.9,
    "wilsonScore": 0.95,
    "totalJobs": 42,
    "skills": ["plumbing"],
    "totalEarnings": 2500,
    "completedJobs": 40
  }
}
```
