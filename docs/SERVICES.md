# Service Architecture & Logic

## 1. Core Services

### Service Factory (Adapter Pattern)
We use a **Factory Pattern** (`ServiceFactory`) to instantiate external providers. This ensures the core logic is agnostic of the specific 3rd party vendor.
- **Interfaces**: Defined in `src/core/interfaces/providers.interface.ts`.
- **Implementations**:
  - `StripeProvider` implements `IPaymentProvider`.
  - `NodemailerProvider` implements `IEmailProvider`.
  - `RedisOTPProvider` implements `IOTPProvider`.

## 2. Business Logic Modules

### Pricing Engine
**Goal**: Calculate a fair price for a service.
- **Inputs**: Service Type, Distance (km), Demand Multiplier.
- **Logic**: `Base Price + (Distance * Rate) + Visit Fee`.
- **Surge**: `MEDIUM` (1.2x) or `HIGH` (1.5x) based on manual or algorithmic triggers.

### Matching Engine (Geospatial)
**Goal**: Assign the best worker.
1. **Query**: Users Redis `GEORADIUS` to find workers within `x` km.
2. **Filter**: MongoDB query to filter by `isOnline: true` and `skills`.
3. **Rank**: Sort results by **Wilson Score** (Confidence interval of positive ratings).

### Warranty Service
**Goal**: Provide trust.
- **Trigger**: Job Completion.
- **Action**: Creates a `Warranty` record expiring in 7 days.
- **Effect**: If a new job is created for the same category/customer within 7 days, logic can optionally flag it as a warranty claim (feature flag).

## 3. Real-Time Logic (Socket.io)
- **State**: Workers update location `lat/long` via socket.
- **Persistence**: Redis Geo-Set (`geoadd users:locations`).
- **Broadcast**: When a job matches, server emits `job:offer` to relevant `userIds` (looked up via matching engine).

## 4. Admin & Maintenance
- **Health**: Real-time ping to Stripe/SMTP/Redis.
- **Maintenance**: A Redis key `maintenance:user_app` = `true` triggers a 503 Service Unavailable in the `maintenanceMiddleware`.
