# Admin Module

## Overview
Provides dashboard analytics and management capabilities.

## Endpoints
- `GET /api/v1/admin/dashboard`: Get system stats (User count, Revenue, etc.).
- `GET /api/v1/admin/users`: List all users.
- `GET /api/v1/admin/workers`: List all workers.
- `PATCH /api/v1/admin/workers/:id/verify`: Verify a worker account.

## Notes
- Requires `admin` or `superadmin` role.
