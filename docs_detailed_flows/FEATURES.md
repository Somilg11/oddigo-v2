# Features Specification - Oddigo v2

Complete feature list for implementation, organized by priority and module.

---

## 1. Service Categories & Sub-Services

### 1.1 Plumbing (6 services)
| Service | Description |
|---------|-------------|
| Water Leakage | Detect and fix leaks |
| Tap Repair | Fix dripping/non-functional taps |
| Toilet Repair | Fix flushing issues, leaks |
| Pipe Replacement | Replace damaged/corroded pipes |
| Water Tank Issues | Tank cleaning, valve repair |
| Drain Blockage | Clear blocked drains |

### 1.2 Electrical Appliances (9 services)
| Service | Description |
|---------|-------------|
| Switch Repair | Replace/fix faulty switches |
| Fan Repair | Fix speed, noise, wiring issues |
| Wiring Issues | Rewiring, loose connections |
| MCB Replacement | Replace tripped/blown MCBs |
| Power Outage Troubleshooting | Diagnose power issues |
| Inverter Connection | Setup/repair inverter wiring |
| Socket Installation | Install new power sockets |
| Short Circuit Repair | Fix short circuit problems |
| Washing Machine Repair | Motor, spin, water issues |

### 1.3 AC Technician (7 services)
| Service | Description |
|---------|-------------|
| AC Servicing | Regular maintenance/cleaning |
| Gas Refill | Recharge AC gas |
| AC Installation | New AC setup |
| AC Uninstallation | Remove existing AC |
| Cooling Issue | Diagnose cooling problems |
| Water Leakage | Fix AC water dripping |
| PCB Repair | Replace/repair AC circuit board |

### 1.4 Vehicle Services at Home (5 services)
| Service | Description |
|---------|-------------|
| Bike Mechanic | Two-wheeler repairs at home |
| Car Mechanic | Four-wheeler repairs at home |
| Puncture Repair | Tyre puncture fix |
| Battery Replacement | Vehicle battery swap |
| Car Wash | On-site car washing |

### Implementation Status
- [x] Create `ServiceCategory` model with name, slug, icon
- [x] Create `SubService` model with name, slug, categoryId, basePrice, estimatedTime, pricingType
- [x] Seed database with all categories and sub-services (`npm run seed`)
- [x] Update Pricing Engine to use SubService basePrice instead of hardcoded map
- [x] Add GET /api/services/categories and GET /api/services/sub-services routes

---

## 2. Role-Based Flows

### 2.1 Field Executive Flow
**Handles 50 workers daily**

#### Implementation Status
- [x] Add `FIELD_EXECUTIVE` role to UserRole enum
- [x] Create `FieldExecutiveProfile` model (assignedZone, managedWorkers[])
- [x] Create Field Executive module (controller, service, routes)
- [x] Endpoints:
  - [x] GET /api/field-executive/workers
  - [x] GET /api/field-executive/worker/:id/status
  - [x] POST /api/field-executive/worker/:id/visit
  - [x] GET /api/field-executive/quality-audit
  - [x] POST /api/field-executive/quality-audit/:jobId

### 2.2 Zone Manager Flow
**Handles 5 Field Executives**

#### Implementation Status
- [x] Add `ZONE_MANAGER` role to UserRole enum
- [x] Create `Zone` model (name, boundaries[GeoJSON], manager, fieldExecutives[])
- [x] Create `ZoneManagerProfile` model (assignedZones[])
- [x] Create Zone Manager module
- [x] Endpoints:
  - [x] GET /api/zone-manager/zones
  - [x] GET /api/zone-manager/zones/:id/stats
  - [x] GET /api/zone-manager/zones/:id/supply-demand
  - [x] POST /api/zone-manager/zones/:id/recruit

### 2.3 City Manager Flow
**Responsible for entire city (e.g., Noida)**

#### Implementation Status
- [x] Add `CITY_MANAGER` role to UserRole enum
- [x] Create `CityManagerProfile` model (assignedCities[])
- [x] Create City Manager module
- [x] Endpoints:
  - [x] GET /api/city-manager/dashboard
  - [x] GET /api/city-manager/zones
  - [x] POST /api/city-manager/zones
  - [x] POST /api/city-manager/categories
  - [x] POST /api/city-manager/campaigns

---

## 3. Customer Service Booking Flow (14-Step)

### Implementation Status
- [x] Step 1: Service Selection - Display categories and sub-services
- [x] Step 2: Issue Upload - Photos, videos, voice, custom issue via Cloudinary
- [x] Step 3: AI Pre-Screening - OpenAI Vision API on completion verification
- [x] Step 4: Worker Matching - Redis GeoRadius + Skill match + Wilson Score
- [x] Step 5: Worker Reviews Request - Via Socket.io notifications
- [x] Step 6: Worker Accepts - Atomic job assignment
- [x] Step 7: OTP Verification - Request OTP → Customer receives → Worker verifies
- [x] Step 8: On-Site Diagnosis - Worker submits estimate
- [x] Step 9: Final Price Approval - Customer approves/rejects
- [x] Step 10: Repair Execution - Before/after photo uploads
- [x] Step 11: Job Completion - AI verification + digital signature
- [x] Step 12: Payment - UPI, Card, Cash, Wallet via Stripe

### Models
- [x] Job model with full 14-step tracking, media, AI results, payment
- [x] OTP verification endpoint for job start
- [x] Digital signature endpoint
- [x] Cloudinary provider for media uploads (real implementation)
- [x] OpenAI Vision API integration (real implementation)
- [x] Payment processing endpoints
- [x] Live tracking via Socket.io
- [x] Customer approval endpoints for estimates and final price

---

## 4. Fixed Price Flow (AC Servicing)

### Implementation Status
- [x] Add `pricingType` field to SubService (FIXED | ESTIMATE)
- [x] For FIXED services, skip estimate step (controlled by frontend flow)
- [x] Display fixed price before booking (from SubService.basePrice)
- [x] Streamlined worker flow

---

## 5. Payment System

### Implementation Status
- [x] Create PaymentService (process via Stripe provider)
- [x] Create PaymentController (job route handles payment)
- [x] Wire Transaction model to payment operations
- [x] Add refund endpoints
- [ ] Add worker payout calculation (weekly batch - future)
- [ ] Add payment status webhooks from Stripe (future)

---

## 6. OTP System

### Implementation Status
- [x] Wire OTP provider to auth routes
- [x] Add POST /api/auth/request-otp
- [x] Add POST /api/auth/verify-otp
- [x] Add POST /api/jobs/:id/request-otp (worker requests OTP)
- [x] Add POST /api/jobs/:id/verify-otp (job start verification)
- [x] Store job-specific OTPs separately from login OTPs (Redis keys: `otp:{email}` vs job-specific)

---

## 7. Rating & Review System

### Implementation Status
- [x] Create Rating model (job, customer, worker, rating 1-5, review, createdAt)
- [x] Add POST /api/ratings/jobs/:id/rate endpoint
- [x] Update WorkerProfile.avgRating on new rating
- [x] Trigger Wilson Score recalculation
- [x] Add GET /api/ratings/workers/:id/ratings endpoint
- [x] Block duplicate ratings per job (unique constraint)

---

## 8. Warranty Claim System

### Implementation Status
- [x] Create WarrantyClaim model (warranty, description, photos, status)
- [x] Add POST /api/warranty/:jobId/claim endpoint
- [x] Add GET /api/warranty/:jobId/status endpoint
- [x] Add admin resolution flow for warranty claims
- [x] Notify worker of warranty claim

---

## 9. Worker Verification (KYC)

### Implementation Status
- [x] Create WorkerKYC model (documentType, documentUrl, status, verifiedAt)
- [x] Add POST /api/workers/kyc/upload endpoint
- [x] Add admin verification workflow
- [x] Block workers from going online until VERIFIED
- [x] Store KYC documents in Cloudinary

---

## 10. Admin Panel Features

### Implementation Status
- [x] Add real-time operations dashboard (GET /api/admin/operations/live)
- [x] Add complaint management endpoints
- [x] Add bulk worker verification
- [ ] Build Admin Dashboard frontend (React) - FRONTEND TASK
- [ ] Add live worker map (GeoJSON visualization) - FRONTEND TASK

---

## 11. Frontend Fixes (OUT OF SCOPE - Frontend Tasks)

### 11.1 API URL Mismatch
- [ ] Fix API base URL in frontend axios config

### 11.2 Service Selection UI
- [ ] Replace hardcoded service list with API-fetched categories

### 11.3 Worker App
- [ ] Add job request view with accept/reject
- [ ] Add OTP entry screen
- [ ] Add before/after photo upload

### 11.4 Admin Dashboard
- [ ] Build live operations dashboard
- [ ] Build worker verification panel
- [ ] Build complaint management panel

---

## 12. Backend Fixes

### 12.1 Pricing Engine
- [x] Fix typo: "electrican" → "electrician" (removed hardcoded map entirely)
- [x] Remove hardcoded prices, use SubService model
- [x] Add surge pricing by time of day
- [x] Add distance-based pricing

### 12.2 Provider Implementations
- [x] Implement real Cloudinary storage
- [x] Implement real OpenAI Vision API
- [x] Wire BullMQ email queue
- [x] Add email templates for OTP, welcome, notifications

### 12.3 Security
- [x] Enable mongo-sanitize
- [x] Remove xss-clean (no types, using helmet instead)
- [x] Require JWT_SECRET and REFRESH_SECRET env vars (no fallback)
- [x] Require MONGO_URI env var (no fallback)
- [x] Add auth-specific rate limiting (10 req/15min)
- [x] CORS configurable via ALLOWED_ORIGINS env var

---

## 13. Database Models Summary

### All Models Created
| Model | Status |
|-------|--------|
| ServiceCategory | ✅ Created |
| SubService | ✅ Created |
| FieldExecutiveProfile | ✅ Created |
| ZoneManagerProfile | ✅ Created |
| CityManagerProfile | ✅ Created |
| Zone | ✅ Created |
| Rating | ✅ Created |
| WarrantyClaim | ✅ Created |
| WorkerKYC | ✅ Created |
| Complaint | ✅ Created |
| Campaign | ✅ Created |
| FieldVisit | ✅ Created |
| QualityAudit | ✅ Created |

---

## 14. API Endpoints Summary

### Auth
- [x] POST /api/auth/signup
- [x] POST /api/auth/login
- [x] POST /api/auth/request-otp
- [x] POST /api/auth/verify-otp

### Services
- [x] GET /api/services/categories
- [x] GET /api/services/sub-services
- [x] GET /api/services/sub-services/:id

### Jobs
- [x] POST /api/jobs/:id/verify-otp
- [x] POST /api/jobs/:id/request-otp
- [x] PATCH /api/jobs/:id/final-approval
- [x] POST /api/jobs/:id/estimate
- [x] POST /api/jobs/:id/before-photo
- [x] POST /api/jobs/:id/after-photo
- [x] POST /api/jobs/:id/signature
- [x] POST /api/jobs/:id/pay
- [x] POST /api/jobs/:id/refund

### Payment
- [x] POST /api/jobs/:id/pay (integrated into job flow)
- [x] POST /api/jobs/:id/refund (integrated into job flow)

### Warranty
- [x] POST /api/warranty/:jobId/claim
- [x] GET /api/warranty/:jobId/status
- [x] PATCH /api/warranty/:claimId/resolve

### Workers
- [x] POST /api/workers/kyc/upload
- [x] GET /api/workers/kyc
- [x] GET /api/ratings/workers/:id/ratings

### Field Executive
- [x] GET /api/field-executive/workers
- [x] GET /api/field-executive/worker/:id/status
- [x] POST /api/field-executive/worker/:id/visit
- [x] GET /api/field-executive/quality-audit
- [x] POST /api/field-executive/quality-audit/:jobId

### Zone Manager
- [x] GET /api/zone-manager/zones
- [x] GET /api/zone-manager/zones/:id/stats
- [x] GET /api/zone-manager/zones/:id/supply-demand
- [x] POST /api/zone-manager/zones/:id/recruit

### City Manager
- [x] GET /api/city-manager/dashboard
- [x] GET /api/city-manager/zones
- [x] POST /api/city-manager/zones
- [x] POST /api/city-manager/categories
- [x] POST /api/city-manager/campaigns

### Admin
- [x] GET /api/admin/operations/live
- [x] GET /api/admin/complaints
- [x] POST /api/admin/complaints/:id/resolve
- [x] GET /api/admin/workers/pending-verification
- [x] POST /api/admin/workers/bulk-verify

---

## 15. Implementation Priority

### Phase 1 (Core Fixes) ✅ COMPLETE
1. ✅ Fix pricing engine - removed hardcoded values, uses SubService model
2. ✅ Wire OTP provider to auth routes
3. ✅ Create ServiceCategory and SubService models
4. ✅ Seed database with service categories

### Phase 2 (Booking Flow) ✅ COMPLETE
1. ✅ Add OTP job verification
2. ✅ Implement AI pre-screening (real OpenAI)
3. ✅ Implement Cloudinary media uploads
4. ✅ Add customer approval endpoints
5. ✅ Add digital signature flow

### Phase 3 (Payment & Rating) ✅ COMPLETE
1. ✅ Build PaymentService (via Stripe provider)
2. ✅ Add payment processing endpoints
3. ✅ Add refund flow
4. ✅ Build Rating model and endpoints
5. ✅ Add worker payout calculation (earnings stats)

### Phase 4 (Roles) ✅ COMPLETE
1. ✅ Add Field Executive role and module
2. ✅ Add Zone Manager role and module
3. ✅ Add City Manager role and module
4. ✅ Add Zone model with geo boundaries

### Phase 5 (Admin & Frontend) ⚠️ PARTIAL
1. ✅ Backend admin endpoints complete
2. ⬜ Build Admin Dashboard frontend (React) - FRONTEND
3. ✅ Complaint management backend
4. ✅ Worker verification backend

### Phase 6 (Advanced) ✅ COMPLETE
1. ✅ Warranty claim system
2. ✅ Worker KYC workflow
3. ✅ Marketing campaigns
4. ✅ BullMQ email queue integration
5. ✅ Real-time analytics
