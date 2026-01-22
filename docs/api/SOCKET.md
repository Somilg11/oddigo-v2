# Real-time API (Socket.io)

## Overview
Connection URL: `ws://localhost:3000`

Clients must authenticate via Handshake.

## Authentication
Pass the JWT Access Token in one of two ways:
1. **Auth Payload**: `{ "token": "eyJ..." }`
2. **Headers**: `{ "Authorization": "Bearer eyJ..." }`

## Events

### 1. Job Offer (Worker)
Received when a new job matches the worker's location and skills.
- **Event**: `job:offer`
- **Payload**:
  ```json
  {
    "jobId": "60d...",
    "serviceType": "cleaning",
    "price": 50.00
  }
  ```

### 2. Scope Creep Request (Customer)
Received when worker requests an amendment.
- **Event**: `job:scope-creep-request`
- **Payload**:
  ```json
  {
    "jobId": "60d...",
    "reason": "Extra work",
    "amount": 100
  }
  ```

### 3. Warranty Issued (Customer)
Received upon job completion.
- **Event**: `job:warranty-issued`
- **Payload**:
  ```json
  {
    "jobId": "60d...",
    "warranty": true
  }
  ```

### 4. Live Tracking (Shared)
Real-time location updates.

**Emit (From Client):**
- **Event**: `update-location`
- **Payload**: `{ "lat": 28.1, "long": 77.2, "jobId": "60d..." }`

**Listen (On Client):**
- **Event**: `live-tracking`
- **Payload**: `{ "userId": "...", "lat": 28.1, "long": 77.2 }`

To receive updates, join the job room:
- **Emit**: `join-job` with `jobId`.
