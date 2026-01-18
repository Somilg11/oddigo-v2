# Data Flow & Interaction Diagrams

This document details the flow of data and control through the InstaServe system. It focuses on the time-ordered sequence of events between system components.

## 1. System Context (Component Interaction)

The high-level exchange of data between the System and External Entities.

```mermaid
graph TD
    User[User]
    Worker[Worker]
    Admin[Admin]
    System((InstaServe System))
    Bank[Payment Gateway]
    Maps[Google Maps API]
    OpenAI[OpenAI API]

    User -- Service Request --> System
    System -- Booking Confirmation --> User
    
    Worker -- Location/Status --> System
    System -- Job Assignments --> Worker

    System -- Charge Request --> Bank
```

### Interaction Overview
This diagram illustrates the boundaries of the system.
*   **Inbound Data**: The System receives Service Requests (User), Location Updates (Worker), and Management Commands (Admin).
*   **Outbound Data**: The System pushes Booking Confirmations (User), Job Assignments (Worker), and Financial Requests (Bank).

---

## 2. Booking & Pricing Flow (Detailed Sequence)

Data flow for calculating price, generating estimates, and confirming a booking.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant PricingEngine as Pricing Service
    participant Match as Matching Engine
    participant Rank as Ranking Service

    User->>PricingEngine: Request Estimate (Service, Location)
    PricingEngine-->>User: Returns Estimate ($$)
    
    User->>Match: Confirm Booking
    Match->>Rank: Get Best Workers (Wilson Score)
    Rank-->>Match: Returns Sorted List
    Match->>Match: Filter & Broadcast
```

### Step-by-Step Breakdown
1.  **Estimation**: The User selects a service. The `PricingEngine` calculates a dynamic price based on base rates, distance, and current demand (surge).
2.  **Confirmation**: User clicks "Book Now". This triggers the `Matching Engine`.
3.  **Optimization**: Instead of broadcasting to *any* nearby worker, the `Ranking Service` sorts them by reliability (Wilson Score).
4.  **Broadcast**: The job is offered to the top-ranked candidates first.

### Key Data Objects
*   `EstimateRequest`: `{ service_id: "cleaning-v1", lat: 28.704, long: 77.102, tier: "premium" }`
*   `WorkerRankTuple`: `[ { worker_id: "w123", distance: 1.2km, score: 0.95 }, ... ]`

---

## 3. Scope Creep & Amendment Flow (New)

Data flow for handling price hikes (amendments) during a job execution. This is a critical feature for "fairness" in the marketplace.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Worker
    participant API as System API
    participant DB as Jobs Database

    Note over Worker: Arrives & Inspects
    Worker->>API: Request Amendment (Reason, NewPrice, Photo)
    
    API->>DB: Update Status -> PAUSED_APPROVAL_PENDING
    API->>DB: Save Amendment Details
    API-->>User: FAST ALERT: "Price Update Request"
    
    alt User Accepts
        User->>API: Approve New Quote
        API->>DB: Update Status -> IN_PROGRESS
        API->>DB: Update final_quote_amount
        API-->>Worker: "Approved - Continue"
    else User Rejects
        User->>API: Reject Quote
        API->>DB: Update Status -> CANCELLED_CHARGED
        API-->>Worker: "Rejected - Stop Work"
        API->>User: Charge 'Visit Fee' ($99)
    end
```

### Functional Description
Often, the scope of work is larger than what the user booked (e.g., "Deep Clean" turned out to be "Industrial Clean").
*   **Pause State**: The job is effectively paused (`PAUSED_APPROVAL_PENDING`) while waiting for the user.
*   **Proof**: The worker MUST upload a photo (e.g., of the extra mess) to justify the hike.
*   **User Agency**: The user has the final say. If they reject, they pay a "Visit Fee" for the worker's time, but not the full job price.

---

## 4. Fulfillment & Warranty Flow

Data flow for job completion and automatic warranty issuance.

```mermaid
sequenceDiagram
    autonumber
    participant Worker
    participant JobMgr as Job Manager
    participant AI as OpenAI Vision
    participant DB as Database

    Worker->>JobMgr: Complete Job & upload P-O-W
    JobMgr->>AI: Verify Image
    
    alt Verified
        JobMgr->>DB: Status -> COMPLETED
        JobMgr->>DB: Create WarrantyRecord (7 Days)
        JobMgr->>DB: Update Worker Ranking (Wilson Score)
        JobMgr-->>Worker: "Job Done + Warranty Active"
    end
```

### Sequence Details
1.  **Proof of Work (P-O-W)**: Worker signals completion. Uses camera to capture the result.
2.  **AI Audit**: `OpenAI` (Vision Model) checks if the image matches the service type (e.g., "Is this a clean room?").
3.  **Closure**:
    *   **Financial**: Funds released to Worker wallet.
    *   **Trust**: User gets a 7-day warranty logged in the system.
    *   **Reputation**: Worker's Wilson Score is updated based on the successful completion.
