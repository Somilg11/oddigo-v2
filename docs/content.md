# Content Module (Admin Power)

## Overview
Allows Admins to manage dynamic content like Banners, Offers, and App Configuration.

## Endpoints

### Public (User/Worker App)
- `GET /api/v1/content/banners`: Get active banners.
- `GET /api/v1/content/offers`: Get active offers.
- `GET /api/v1/content/config/:key`: Get specific app config (e.g., `maintenance_mode`).

### Admin Only
- `POST /api/v1/content/banners`: Create a banner.
- `DELETE /api/v1/content/banners/:id`: Delete a banner.
- `POST /api/v1/content/offers`: Create an offer.
- `POST /api/v1/content/config`: Set/Update app config key-value pair.
- `GET /api/v1/content/config`: Get all configs.

## Dynamic Layout
The `AppConfig` endpoints allow the frontend to fetch JSON configurations to render UI dynamically.
Example Config:
```json
{
  "key": "home_layout",
  "value": {
    "sections": ["banners", "services", "offers", "top_workers"]
  }
}
```
