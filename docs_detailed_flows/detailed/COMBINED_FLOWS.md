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
        Edge[Edge Functions (Auth/Rate Limit)]
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

## 3. Unified Data Relationship Snapshot
A simplified view of how the core data entities relate to support the flow above.

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
