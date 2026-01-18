# Combined System Flows

This document unifies the specific architectural views into a single cohesive narrative, illustrating the complete lifecycle of the InstaServe platform, including advanced modules.

## 1. The Core Ecosystem
The following High-Level diagram re-iterates how all major components—Mobile Apps, Edge Services, Core Backend, and External APIs—orchestrate together.

```mermaid
graph TD
    subgraph Users
        UserApp[User Application]
        WorkerApp[Worker Application]
    end

    subgraph "Core Backend Services"
        API[Monolith API]
        Match[Matchmaking Service]
        Pricing[Pricing Engine]
        Ranking[Ranking Engine]
        JobMgr[Job Manager]
    end

    subgraph "External Providers"
        Maps[Google Maps]
        AI[OpenAI Vision]
        Stripe[Payment Gateway]
    end

    UserApp --> API
    WorkerApp --> API
    API --> Pricing
    API --> Match
    Match --> Ranking
    API --> JobMgr
    JobMgr --> AI
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
    U->>S: Request Service
    S->>S: Rank Workers (Wilson Score)
    S-->>U: Estimate & Worker Found

    Note over U, W: Phase 2: Execution
    W->>S: Arrive & Start (OTP)
    
    opt Scope Creep (Amendment)
        W->>S: Flag "Scope Mismatch" -> New Quote
        S->>U: Alert: Approve $?
        U->>S: Approve
        S->>W: Resume Work
    end
    
    W->>S: Complete Job + Image
    S->>P: Process Payment
    
    Note over S: Phase 3: Warranty
    S->>S: Issue 7-Day Warranty
    S-->>U: "Warranty Active!"
```

## 3. Worker Onboarding & KYC Flow
The journey of a new worker joining the platform.

```mermaid
sequenceDiagram
    autonumber
    participant W as Worker App
    participant S as System API
    participant DB as Database
    participant Admin as Admin Panel

    W->>S: Register (Phone + OTP)
    S->>DB: Create Worker Record (Status: PENDING)
    Admin->>S: Approve Worker
    S->>DB: Set status = ACTIVE
```

## 4. Dispute Resolution Flow
Complex flow involving AI flagging and manual admin intervention.

```mermaid
sequenceDiagram
    autonumber
    participant W as Worker
    participant S as System
    participant AI as AI Service
    participant A as Admin

    W->>S: Upload Proof Image
    S->>AI: Analyze Quality
    
    alt Low Confidence Score (<80%)
        AI-->>S: Score: 45/100 (FAIL)
        S->>S: Flag Job as "DISPUTED"
        S-->>A: Alert: "Review Job"
        A->>S: Resolve
    end
```

## 5. Job Cancellation & Refund Flow
Handling cancellations after booking.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant S as System
    participant P as Payment Gateway

    U->>S: Cancel Job Request
    S->>P: Refund
```
