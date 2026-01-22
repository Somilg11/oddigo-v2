# Notification API

## Overview
Base URL: `/api/notifications`
**Auth Required**: Yes

While real-time updates happen via Socket.io, this API allows retrieving the history of alerts (for "Inbox" view).

## Endpoints

### 1. Get My Notifications
Fetch list of past notifications.

- **URL**: `/`
- **Method**: `GET`

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d...",
      "type": "job:offer",
      "title": "New Job Offer!",
      "message": "New plumbing job available...",
      "isRead": false,
      "createdAt": "2023-10-10T10:00:00Z"
    }
  ]
}
```

### 2. Mark as Read
- **URL**: `/:id/read`
- **Method**: `PATCH`

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Marked as read"
}
```
