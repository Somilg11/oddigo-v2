# Worker Module

## Overview
Manages worker profiles, availability, and documents.

## Endpoints
- `GET /api/v1/workers/profile`: Get current worker profile.
- `PATCH /api/v1/workers/profile`: Update profile (Service Type, Hourly Rate).
- `POST /api/v1/workers/upload-documents`: Upload verification documents (Max 5 files).
- `PATCH /api/v1/workers/toggle-availability`: Switch between Online/Offline.

## Notes
- Requires `Bearer Token` in Authorization header.
