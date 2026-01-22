# User API

## Overview
Base URL: `/api/users`
**Role Required**: `CUSTOMER` (mostly)

## Endpoints

### 1. Get My Profile
Fetch logged-in user details.

- **URL**: `/me`
- **Method**: `GET`

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "60d...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "addresses": [...]
  }
}
```

### 2. Update Profile
Update basic info.

- **URL**: `/me`
- **Method**: `PATCH`

#### Request Body
```json
{
  "name": "Johnathan Doe"
}
```

### 3. Add Address
Save a new address for quick bookings.

- **URL**: `/addresses`
- **Method**: `POST`

#### Request Body
```json
{
  "street": "123 Main St",
  "city": "New York",
  "zip": "10001",
  "coordinates": [ -74.006, 40.7128 ]
}
```

### 4. Delete Address
- **URL**: `/addresses/:id`
- **Method**: `DELETE`
