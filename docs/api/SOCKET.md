# Real-time API (Socket.io)

**Connection URL:** `ws://localhost:3000`
**Transport:** WebSocket (with HTTP long-polling fallback)

---

## Authentication

Pass JWT in handshake:

```js
const socket = io('http://localhost:3000', {
  auth: { token: 'Bearer eyJ...' }
});
```

Or via headers:
```js
{ "Authorization": "Bearer eyJ..." }
```

---

## Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update-location` | `{ lat, long, jobId? }` | Worker sends current GPS coordinates |
| `join-job` | `jobId` | Join a job room for live updates |
| `leave-job` | `jobId` | Leave a job room |

**Example:**
```js
socket.emit('update-location', { lat: 28.5355, long: 77.3910, jobId: '64c3...' });
socket.emit('join-job', '64c3d4e5...');
```

---

## Server → Client Events

### Job Events

| Event | Payload | Description |
|-------|---------|-------------|
| `job:offer` | `{ jobId, serviceType, price, customer, location }` | New job offer for worker |
| `job:assigned` | `{ jobId, worker }` | Job assigned to a worker |
| `job:otp` | `{ jobId, otp }` | OTP sent to customer for verification |
| `job:estimate` | `{ jobId, estimate }` | Worker submitted cost estimate |
| `job:price-approved` | `{ jobId, approved }` | Customer approved/rejected final price |
| `job:scope-creep-request` | `{ jobId, reason, amount }` | Amendment request from worker |
| `job:scope-creep-response` | `{ jobId, approved }` | Customer responded to amendment |
| `job:completed` | `{ jobId }` | Job marked as completed |
| `job:warranty-issued` | `{ jobId, warranty: true }` | Warranty issued on completion |
| `job:cancelled` | `{ jobId, reason }` | Job cancelled |

### Tracking Events

| Event | Payload | Description |
|-------|---------|-------------|
| `live-tracking` | `{ userId, lat, long }` | Real-time worker location |

### Notification Events

| Event | Payload | Description |
|-------|---------|-------------|
| `notification` | `{ type, title, message, data }` | Push notification to user |

---

## Connection Flow

1. **Connect** with auth token
2. **Worker:** Emits `update-location` periodically (every 10s when online)
3. **Customer:** Listens to `live-tracking` to show worker on map
4. **Both:** `join-job` to receive job-specific events
5. **Worker:** Listens to `job:offer` for new jobs
6. **Customer:** Listens to `job:estimate`, `job:otp`, etc.

---

## Example Client Setup

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: `Bearer ${accessToken}` }
});

// Worker goes online
socket.emit('update-location', { lat: 28.5355, long: 77.3910 });

// Listen for job offers (worker)
socket.on('job:offer', (data) => {
  console.log('New job:', data);
});

// Customer joins a job room
socket.emit('join-job', jobId);

// Customer tracks worker location
socket.on('live-tracking', (data) => {
  updateMapMarker(data.lat, data.long);
});
```
