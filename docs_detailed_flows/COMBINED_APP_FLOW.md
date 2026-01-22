# Combined System Flows

This document unifies the specific architectural views into a single cohesive narrative, illustrating the complete lifecycle of the InstaServe platform, including advanced modules.

## 1. The Core Ecosystem
The following High-Level diagram re-iterates how all major components—Mobile Apps, Core Backend, and External APIs—orchestrate together.

```mermaid
graph TD
    subgraph Clients
        UserApp[User Application]
        WorkerApp[Worker Application]
        AdminPanel[Admin Dashboard]
    end

    subgraph "Core Backend Services"
        API[Monolith API]
        Factory[Service Factory]
        Match[Matchmaking Engine]
        Pricing[Pricing Engine]
        Ranking[Ranking Engine]
        JobMgr[Job Manager]
    end

    subgraph "External Providers"
        Stripe[Stripe (Payments)]
        Redis[Redis (OTP/Geo)]
        SMTP[Nodemailer (Email)]
        Cloudinary[Cloudinary (Storage)]
        OpenAI[OpenAI (Vision AI)]
    end

    UserApp --> API
    WorkerApp --> API
    AdminPanel --> API
    
    API --> Pricing
    API --> JobMgr
    JobMgr --> Match
    Match --> Ranking
    
    API --> Factory
    Factory --> Stripe
    Factory --> SMTP
    Factory --> Cloudinary
    Factory --> OpenAI
    Factory --> Redis
```

## 2. The Complete End-to-End Booking Cycle (with Scope Creep)
This sequence diagram shows the full path, including the potential for "Scope Creep" amendments.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant S as System
    participant W as Worker
    participant P as Payment

    Note over U, S: Phase 1: Discovery & Ranking
    U->>S: Request Service (Loc, Type)
    S->>S: PricingEngine.getEstimate()
    S->>S: MatchingEngine.findWorkers()
    S-->>U: Estimate & Job Created

    S-->>U: Estimate & Job Created

    Note over U, W: Phase 2: Execution
    W->>S: Accept Job (Atomic Lock)
    S-->>W: Assigned!
    W->>S: Arrive & Start Job
    W->>S: Start Job
    
    opt Scope Creep (Amendment)
        W->>S: Request Amendment (Reason + Price)
        S->>U: Alert: "Scope Mismatch"
        U->>S: Approve Amendment
        S->>W: Resume Work
    end
    
    W->>S: Complete Job + Proof Image
    S->>S: OpenAI.verify(Proof)
    S->>P: Process Payment
    
    Note over S: Phase 3: Warranty
    S->>S: Issue 7-Day Warranty
    S-->>U: "Warranty Active!"
```

## 3. Dispute Resolution Flow
Complex flow involving AI flagging and manual admin intervention.

```mermaid
sequenceDiagram
    autonumber
    participant W as Worker
    participant S as System
    participant AI as OpenAI Provider
    participant A as Admin

    W->>S: Upload Proof Image (Complete Job)
    S->>AI: analyzeImage(url, prompt)
    
    alt Low Confidence Score (<70%)
        AI-->>S: "Unclear evidence" (Confidence: 0.4)
        S-->>W: Error: Verification Failed
        W->>S: Appeal / Contact Admin
        S->>A: Flag Job as "DISPUTED"
        A->>S: Manual Resolve (Approve/Reject)
    end
    
    alt High Confidence
        AI-->>S: "Valid Work" (Confidence: 0.95)
        S->>S: Mark COMPLETED
    end
```

## 4. Maintenance Mode Flow
Admin control over application availability.

```mermaid
sequenceDiagram
    participant A as Admin
    participant S as System
    participant R as Redis
    participant U as User

    A->>S: Toggle Maintenance (USER APP = true)
    S->>R: set('maintenance:user_app', 'true')
    
    U->>S: Any API Request
    S->>S: MaintenanceMiddleware.check()
    S->>R: get('maintenance:user_app')
    R-->>S: 'true'
    S-->>U: 503 Service Unavailable
```
