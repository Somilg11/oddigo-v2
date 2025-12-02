# User Module

## Overview
Manages user profiles and searching for workers.

## Endpoints
- `GET /api/v1/users/profile`: Get current user profile.
- `PATCH /api/v1/users/profile`: Update profile (Name, Address).
- `GET /api/v1/users/search-workers`: Search for workers.
    - Query Params: `lat`, `lng`, `serviceType`, `distance` (in km).

## Notes
- Requires `Bearer Token` in Authorization header.
