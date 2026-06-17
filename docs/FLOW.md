# Application Flow - Oddigo v2

Complete backend flow documentation for all user roles and features.

---

## 1. Customer Service Booking Flow (14 Steps)

### Step 1: Service Selection
```
GET /api/services/categories          → List categories (Plumbing, Electrical, AC, Vehicle)
GET /api/services/sub-services?categoryId=xxx  → List sub-services in category
```
- Customer selects a category and sub-service
- Each sub-service has: `basePrice`, `estimatedTime`, `pricingType` (FIXED or ESTIMATE)

### Step 2: Issue Upload
```
(Upload to Cloudinary via frontend)
POST /api/jobs  →  Create job with photos/videos/voiceNote
```
- Photos and videos are uploaded to Cloudinary first
- URLs are passed to the job creation endpoint
- Custom issue text can be added via `customIssue` field

### Step 3: AI Pre-Screening
```
(Passes to Step 4 - AI runs on job completion verification)
```
- During job creation, the system stores media references
- AI analysis happens when worker submits completion proof
- Uses OpenAI GPT-4 Vision API for image analysis

### Step 4: Worker Matching
```
POST /api/jobs/:id/find-workers
```
- Redis GEORADIUS finds workers within 10km
- Skills are matched using service-to-skill mapping
- Workers ranked by Wilson Score (rating confidence)
- Top workers receive job offer via Socket.io
- Workers see: serviceType, price estimate

### Step 5: Worker Reviews Request
```
(Socket event: job:offer → Worker receives notification)
```
- Worker sees job details via the notification
- Worker can Accept or Ignore

### Step 6: Worker Accepts
```
POST /api/jobs/:id/accept
```
- Only the first worker to accept gets the job (atomic update)
- Status changes: `MATCHING` → `ACCEPTED`
- Customer is notified

### Step 7: Worker Travels → OTP Request
```
POST /api/jobs/:id/start           → Worker marks as traveling
POST /api/jobs/:id/request-otp     → Worker requests OTP from customer
```
- Worker travels to customer location
- Live tracking via Socket.io (`update-location` event)
- On arrival, worker requests OTP

### Step 8: OTP Verification
```
(Socket event: job:otp → Customer receives OTP in app)
POST /api/jobs/:id/verify-otp     → Worker enters OTP
```
- Customer shares OTP verbally with worker
- Worker enters OTP to verify physical presence
- Service officially begins

### Step 9: On-Site Diagnosis
```
POST /api/jobs/:id/estimate       → Worker submits cost estimate
```
- Worker inspects the issue
- Submits: visitCharge, labourCost, partsCost, notes
- Customer receives estimate via Socket

### Step 10: Customer Approval
```
PATCH /api/jobs/:id/final-approval  → Customer approves/rejects
```
- Customer sees worker profile, rating, cost breakdown
- Can approve or reject
- If rejected, job is cancelled
- If approved, work begins

### Step 11: Repair Execution
```
POST /api/jobs/:id/before-photo    → Upload before photo
POST /api/jobs/:id/after-photo     → Upload after photo
```
- Worker performs the repair
- Uploads before and after photos to Cloudinary

### Step 12: Job Completion
```
POST /api/jobs/:id/complete        → Worker completes with AI verification
```
- Worker submits proof photo
- OpenAI Vision API verifies the work
- If AI confidence < 70%, completion is rejected
- Status changes to `COMPLETED`
- 7-day warranty is automatically issued

### Step 13: Digital Signature
```
POST /api/jobs/:id/signature       → Customer signs digitally
```
- Customer provides digital signature (base64)
- Stored on the job record

### Step 14: Payment
```
POST /api/jobs/:id/pay             → Process payment
```
- Customer chooses: UPI, CARD, CASH, or WALLET
- Stripe creates PaymentIntent for UPI/CARD
- Cash is marked as paid without processing
- Job status: `COMPLETED` with `paymentStatus: COMPLETED`
- Warranty is active for 7 days

---

## 2. Fixed Price Flow (AC Servicing)

For services with `pricingType: "FIXED"`:

```
Customer selects service → Fixed price displayed → Creates job
→ Worker matching → Accept → OTP → Service → Photos → Complete → Pay
```

- Steps 9-10 (estimate + approval) are skipped
- Price is the `basePrice` from SubService model
- No amendment/scope creep flow

---

## 3. Worker Payout Flow

```
Job Completed → Payment Processed → Transaction Created
→ Platform Fee Deducted (10-20%) → Worker Payout
```

- Platform fee is calculated on `finalQuote`
- Payout is scheduled (weekly/bi-weekly)
- Worker earnings visible via `GET /api/workers/stats`

---

## 4. Warranty Claim Flow

```
Warranty Active → Customer Files Claim → Admin Reviews
→ Resolution (Re-repair / Refund / Reject)
```

```
POST /api/warranty/:jobId/claim     → File claim with description + photos
GET /api/warranty/:jobId/status     → Check warranty/claim status
PATCH /api/warranty/:claimId/resolve → Admin resolves (RESOLVED / REJECTED)
```

---

## 5. Worker KYC Flow

```
Worker Registers → Uploads Documents → Admin Verifies
→ All Required Docs Verified → Worker Status: VERIFIED → Can Go Online
```

### Required Documents
1. Aadhaar (Identity)
2. PAN (Tax)
3. Bank Details (Payout account)

### Optional Documents
4. Skill Test
5. Police Verification

```
POST /api/workers/kyc/upload   → Upload document (AADHAAR, PAN, etc.)
GET /api/workers/kyc            → Check KYC status
GET /api/admin/workers/pending-verification → Admin views pending
POST /api/admin/workers/bulk-verify         → Admin verifies/rejects
```

Worker cannot go online (`POST /api/workers/availability`) until `verificationStatus: VERIFIED`.

---

## 6. Rating & Review Flow

```
Job Completed → Customer Rates → Worker Rating Updated → Wilson Score Recalculated
```

```
POST /api/ratings/jobs/:id/rate    → Rate 1-5 with optional review
GET /api/ratings/workers/:id/ratings → View worker ratings
```

- One rating per job (unique constraint)
- Wilson Score is recalculated after each rating
- Worker's `avgRating` and `wilsonScore` are updated
- Higher Wilson Score = higher ranking in matching

---

## 7. Complaint Flow

```
Customer Files Complaint → Admin Reviews → Resolution
```

```
POST /api/jobs/:id/complete → (if issue) → Customer files complaint
GET /api/admin/complaints    → Admin views complaints
POST /api/admin/complaints/:id/resolve → Admin resolves with optional refund
```

Categories: `WORKER_BEHAVIOR`, `QUALITY_ISSUE`, `PRICING_DISPUTE`, `NO_SHOW`, `DAMAGE`, `FRAUD`, `OTHER`

---

## 8. Field Executive Flow

```
Field Executive Logs In → Views Assigned Workers → Monitors Status
→ Conducts Field Visits → Performs Quality Audits
```

```
GET /api/field-executive/workers              → List 50 assigned workers
GET /api/field-executive/worker/:id/status    → Worker status (online, jobs, etc.)
POST /api/field-executive/worker/:id/visit    → Log field visit
GET /api/field-executive/quality-audit        → View audits
POST /api/field-executive/quality-audit/:jobId → Submit audit (before/after photos, invoice)
```

### Quality Audit Checks
- Before photos exist
- After photos exist
- Invoice is valid
- Status: PASSED or FAILED

---

## 9. Zone Manager Flow

```
Zone Manager → Views Zones → Checks Supply/Demand → Triggers Recruitment
```

```
GET /api/zone-manager/zones                     → List assigned zones
GET /api/zone-manager/zones/:id/stats            → Revenue, workers, jobs
GET /api/zone-manager/zones/:id/supply-demand    → Worker vs request ratio
POST /api/zone-manager/zones/:id/recruit         → Request new workers
```

### Recruitment Trigger
When `pendingRequests > availableWorkers * 2`, the system flags `needsRecruitment: true`.

---

## 10. City Manager Flow

```
City Manager → Views Dashboard → Manages Zones, Categories, Campaigns
```

```
GET /api/city-manager/dashboard      → Total orders, revenue, workers, ratings, cancellation %
GET /api/city-manager/zones          → All zones in city
POST /api/city-manager/zones         → Create new zone
POST /api/city-manager/categories    → Add new service category
POST /api/city-manager/campaigns     → Create marketing campaign
```

---

## 11. Admin Flow

```
Admin → System Health → Analytics → Worker Verification → Complaints → Live Ops
```

```
GET /api/admin/health                        → Provider health checks
GET /api/admin/analytics                     → Users, jobs, GMV
GET /api/admin/operations/live               → Real-time operations
GET /api/admin/disputes                      → Cancelled/charged jobs
POST /api/admin/verify-worker                → Approve/reject worker
PATCH /api/admin/users/status                → Activate/deactivate user
GET /api/admin/complaints                    → List complaints
POST /api/admin/complaints/:id/resolve       → Resolve complaint
GET /api/admin/workers/pending-verification  → Pending KYC
POST /api/admin/workers/bulk-verify          → Bulk KYC verification
POST /api/admin/maintenance                  → Toggle maintenance mode
```

---

## 12. Real-Time WebSocket Flow

### Connection
```javascript
const socket = io('http://localhost:3000', {
    auth: { token: 'Bearer <jwt>' }
});
```

### Worker Location Updates
```javascript
// Worker sends location every 30 seconds
socket.emit('update-location', {
    lat: 28.5355,
    long: 77.3910,
    jobId: 'active-job-id'  // optional - for live tracking
});
```

### Job Room
```javascript
// Join a job room for real-time updates
socket.emit('join-job', 'job-id');

// Listen for events
socket.on('job:offer', (data) => { /* New job offer */ });
socket.on('job:otp', (data) => { /* OTP received */ });
socket.on('job:estimate', (data) => { /* Estimate received */ });
socket.on('job:price-approved', (data) => { /* Price approved */ });
socket.on('job:scope-creep-request', (data) => { /* Amendment */ });
socket.on('job:warranty-issued', (data) => { /* Warranty issued */ });
socket.on('live-tracking', (data) => { /* Worker location */ });
```

---

## 13. Payment Processing Flow

### UPI/Card Payment
```
1. POST /api/jobs/:id/pay { paymentMethod: "UPI" }
2. Backend creates Stripe PaymentIntent
3. Returns client_secret to frontend
4. Frontend confirms payment with Stripe
5. Webhook updates payment status
```

### Cash Payment
```
1. POST /api/jobs/:id/pay { paymentMethod: "CASH" }
2. Backend marks payment as COMPLETED (no Stripe call)
3. Job is marked as paid
```

### Refund
```
1. POST /api/jobs/:id/refund { reason: "..." }
2. Backend calls Stripe refund API
3. Payment status updated to REFUNDED
4. Job status updated to CANCELLED
```

---

## 14. Media Upload Flow

### Cloudinary Upload
```
1. Frontend uploads file to Cloudinary (directly or via backend)
2. Cloudinary returns secure_url
3. URL is stored on the Job model (photos[], videos[], beforePhotos[], afterPhotos[])
4. AI analyzes completion proof via OpenAI Vision
```

### Supported Media Types
- Photos: `image/jpeg`, `image/png`, `image/webp`
- Videos: `video/mp4`, `video/webm`
- Voice: `audio/mpeg`, `audio/wav`

---

## 15. Email Notification Flow

### BullMQ Queue
```
1. Event triggers email (OTP, job confirmation, warranty)
2. Email job is added to BullMQ queue
3. Worker picks up job and sends via Nodemailer
4. 3 retries with exponential backoff on failure
```

### Email Templates
- OTP Verification
- Job Confirmation
- Warranty Issued
- Worker Payout

---

## Database Indexes

| Collection | Index | Purpose |
|------------|-------|---------|
| `users` | `email` (unique) | Login lookup |
| `users` | `phone` (unique) | Phone lookup |
| `workerprofiles` | `lastLocation` (2dsphere) | Geo search |
| `workerprofiles` | `{isOnline, wilsonScore}` | Matching |
| `jobs` | `customer` | Customer jobs |
| `jobs` | `worker` | Worker jobs |
| `jobs` | `status` | Status filter |
| `jobs` | `location` (2dsphere) | Nearby jobs |
| `ratings` | `job` (unique) | One rating per job |
| `ratings` | `worker` | Worker ratings |
| `warrantyclaims` | `warranty` | Warranty lookup |
| `warrantyclaims` | `status` | Status filter |
| `workerkycs` | `{worker, documentType}` | KYC lookup |
| `complaints` | `status` | Status filter |
| `campaigns` | `{city, status}` | Active campaigns |
