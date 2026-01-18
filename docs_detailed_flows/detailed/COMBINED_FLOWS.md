# Combined System Flows

This document unifies the specific architectural views into a single cohesive narrative, illustrating the complete lifecycle of the InstaServe platform.

## 1. The Core Ecosystem
The following High-Level diagram re-iterates how all major components—Mobile Apps, Edge Services, Core Backend, and External APIs—orchestrate together.

```mermaid
graph TD
    subgraph Users
        UserApp[User Application]
        WorkerApp[Worker Application]
    end

    subgraph "Edge & Gateway"
        GLB[Global Load Balancer]
        Edge["Edge Functions (Auth/Rate Limit)"]
    end

    subgraph "Core Backend Services"
        API[Monolith API]
        Match[Matchmaking Service]
        Pricing[Pricing Engine]
        Socket[Real-time Socket.io]
        JobMgr[Job Manager]
    end

    subgraph "Data & Storage"
        Postgres[(Primary DB)]
        Redis[(Cache & Pub/Sub)]
        S3[(Image Storage)]
    end

    subgraph "External Providers"
        Maps[Google Maps]
        AI[OpenAI Vision]
        Stripe[Payment Gateway]
    end

    UserApp --> GLB
    WorkerApp --> GLB
    GLB --> Edge
    Edge --> API
    
    API --> Match
    API --> Pricing
    API --> JobMgr
    
    Match --> Maps
    Match --> Redis
    
    JobMgr --> Postgres
    JobMgr --> S3
    JobMgr --> AI
    
    API --> Stripe
    
    Socket <--> Redis
    Socket <--> UserApp
    Socket <--> WorkerApp
```

## 2. The Complete End-to-End Booking Cycle
This sequence diagram shows the "Happy Path" from the moment a user opens the app to the final payment settlement.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant S as System (API/Socket)
    participant W as Worker
    participant AI as AI Service
    participant P as Payment

    Note over U, S: Phase 1: Discovery
    U->>S: Search for "Plumber" near me
    S->>S: Calculate Pricing (Base + Surge)
    S-->>U: Display Estimate ($50)

    Note over U, W: Phase 2: Booking
    U->>S: Confirm Booking & Auth Payment
    S->>P: Hold Funds
    S->>S: Find Workers within 5km
    S->>W: Push Notification "New Job: $45"
    W->>S: Accept Job
    S-->>U: "Worker John is on the way!"

    Note over W: Phase 3: Execution
    W->>W: Navigate to Location
    W->>S: Arrive & Verify OTP (Start Job)
    W->>W: Perform Service...
    W->>S: Complete Job & Upload Photo
    
    Note over S, AI: Phase 4: Verification
    S->>AI: Analyze Photo for Quality
    AI-->>S: Score: 95/100 (Pass)
    
    Note over P: Phase 5: Settlement
    S->>P: Capture Funds from User
    S->>P: Transfer Payout to Worker
    S-->>U: Request Review
    S-->>W: Show Earnings
```

## 3. Worker Onboarding & KYC Flow
The journey of a new worker joining the platform, from registration to becoming eligible for jobs.

```mermaid
sequenceDiagram
    autonumber
    participant W as Worker App
    participant S as System API
    participant DB as Database
    participant Admin as Admin Panel

    W->>S: Register (Phone + OTP)
    S->>DB: Create Worker Record (Status: PENDING)
    
    W->>S: Submit Profile (Name, Skills, Zone)
    S->>DB: Update Profile
    
    Note over W, S: Document Submission
    W->>S: Upload ID Proof & Licenses
    S-->>S: Store in S3
    S->>DB: Mark Documents "Under Review"
    
    Admin->>S: Fetch Pending Approvals
    Admin->>Admin: Manual verification of ID
    
    alt Documents Valid
        Admin->>S: Approve Worker
        S->>DB: Update Status -> ACTIVE
        S->>W: Notification "You are now Live!"
    else Documents Invalid
        Admin->>S: Reject (Reason: Blurry Image)
        S->>W: Notif: "Please re-upload ID"
    end
```

## 4. Dispute Resolution Flow
Complex flow involving AI flagging and manual admin intervention when things go wrong.

```mermaid
sequenceDiagram
    autonumber
    participant W as Worker
    participant S as System
    participant AI as AI Service
    participant A as Admin
    participant U as User

    Note over W: Job Finished
    W->>S: Upload Proof Image
    S->>AI: Analyze Quality
    
    alt Low Confidence Score (<80%)
        AI-->>S: Score: 45/100 (FAIL)
        S->>S: Flag Job as "DISPUTED"
        S-->>W: "Job under review"
        S-->>A: Alert: "Review Job #123"
        
        A->>S: View Proof Image & User History
        
        opt Verify with User
            A->>U: Request Feedback
            U-->>A: "He didn't clean the fan"
        end
        
        A->>S: Final Decision: "PARTIAL REFUND"
        S->>S: Refund 50% to User
        S->>S: Pay 50% to Worker
        S-->>W: Penalty Notice
    else High Confidence
        AI-->>S: Score: 90/100 (PASS)
        S->>S: Proceed to Payment
    end
```

## 5. Job Cancellation & Refund Flow
Handling cancellations after booking but before job completion.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant S as System
    participant W as Worker
    participant P as Payment Gateway

    U->>S: Cancel Job Request
    S->>S: Check Job Status
    
    alt Status = ASSIGNED (Worker on way)
        S->>S: Calculate Cancellation Fee ($5)
        S->>P: Charge $5 Fee
        S->>P: Refund Remaining Amount
        S->>W: Notify "Job Cancelled"
        S->>S: Credit $2 to Worker Wallet (Compensation)
    else Status = CREATED (No worker yet)
        S->>P: Full Refund
        S->>S: Close Job
    end
    
    S-->>U: "Cancellation Confirmed"
```

## 6. Unified Data Relationship Snapshot
A simplified view of how the core data entities relate to support the flows above.

```mermaid
erDiagram
    User ||--o{ Job : requests
    Worker ||--o{ Job : fulfills
    Job ||--|| Payment : secured_by
    Job ||--|| ProofOfWork : contains
    
    Payment {
        status escrow_status
        amount final_total
    }
    
    ProofOfWork {
        url image_link
        float ai_score
        timestamp uploaded_at
    }
```
