# Frontend Integration Guide

## Authentication
1.  **Login**: Call `/api/v1/auth/login/{type}`.
2.  **Storage**: Store the returned `token` in `localStorage` or `SecureStore`.
3.  **Headers**: Add `Authorization: Bearer <token>` to all subsequent requests.

## Dynamic Content (Admin Power)
The app is designed to be dynamic.
1.  **On Launch**: Fetch `/api/v1/content/config/maintenance_mode`. If true, show maintenance screen.
2.  **Home Screen**: Fetch `/api/v1/content/banners` and `/api/v1/content/offers` to populate the UI.
3.  **Layouts**: If implementing dynamic layouts, fetch `/api/v1/content/config/home_layout` to determine the order of sections.

## Real-time Updates
1.  Connect to Socket.IO server at the base URL.
2.  Listen for events like `order_update` to refresh order status in real-time.

## Error Handling
- The API returns standard error responses:
  ```json
  {
    "status": "fail" | "error",
    "message": "Error description"
  }
  ```
- Handle `401 Unauthorized` by redirecting to Login.
- Handle `400 Bad Request` by showing validation errors to the user.
