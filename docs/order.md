# Order Module

## Overview
Handles the entire booking flow from creation to completion.

## Endpoints
- `POST /api/v1/orders`: Create a new booking request.
- `GET /api/v1/orders`: Get my orders (User or Worker).
- `GET /api/v1/orders/:id`: Get specific order details.
- `PATCH /api/v1/orders/:id/status`: Update order status.
    - Statuses: `ACCEPTED`, `IN_PROGRESS` (Requires OTP), `COMPLETED` (Requires OTP), `CANCELLED`.

## Flow
1. User creates order -> Status `PENDING`.
2. Worker accepts -> Status `ACCEPTED`.
3. Worker arrives & verifies Start OTP -> Status `IN_PROGRESS`.
4. Work done & verifies End OTP -> Status `COMPLETED`.
