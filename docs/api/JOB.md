# Job Lifecycle API

## Overview
Base URL: `/api/jobs`

Manages the service lifecycle:
`CREATED` -> `MATCHING` -> `ACCEPTED` -> `IN_PROGRESS` -> [`PAUSED_APPROVAL_PENDING`] -> `COMPLETED` -> `CANCELLED`

## Endpoints

### 1. Get Price Estimate
Get quote without booking.
- **URL**: `/estimate`
- **Method**: `POST`
- **Body**: `{ "serviceType": "cleaning" }`

### 2. Create Job (Booking)
- **URL**: `/`
- **Method**: `POST`
- **Body**: `{ "serviceType": "cleaning", "location": { "coordinates": [...] } }`

### 3. Find Workers
- **URL**: `/:id/find-workers`
- **Method**: `POST`

### 4. Accept Job (Worker)
**NEW**: Atomically assigns the job to the first worker who accepts.
- **URL**: `/:id/accept`
- **Method**: `POST`
- **Auth**: Worker
- **Status Transition**: `MATCHING` -> `ACCEPTED`

### 5. Start Job
Worker has arrived.
- **URL**: `/:id/start`
- **Method**: `PATCH`

### 6. Cancel Job
User cancels before work starts.
- **URL**: `/:id/cancel`
- **Method**: `POST`
- **Constraint**: Only if status is `CREATED` or `MATCHING` (or `ACCEPTED` before start).

### 7. Complete Job (With Payment)
- **URL**: `/:id/complete`
- **Method**: `POST`
- **Body**: `{ "proofUrl": "..." }`
- **Logic**: Verifies Proof + Captures Payment + Issues Warranty.

### 8. Scope Creep (Amendment)
- **URL**: `/:id/amendment` (POST/PATCH)

### 9. Get History
- **URL**: `/history`
- **Method**: `GET`
