# Data Flow & Interaction Diagrams

This document details the flow of data and control through the InstaServe system.
Per user request, these are modeled as **Sequence Diagrams** to clearly show the temporal interactions and data exchange between components.

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
    User -- Payment Details --> System
    System -- Booking Confirmation --> User
    System -- Payment Receipt --> User

    Worker -- Location Coordinates --> System
    Worker -- Job Acceptance --> System
    Worker -- Job Evidence Img --> System
    System -- Job Assignments --> Worker
    System -- Payout Advice --> Worker

    Admin -- Configuration Rules --> System
    System -- Performance Reports --> System
    System -- Dispute Alerts --> Admin

    System -- Charge Request --> Bank
    Bank -- Transaction Status --> System

    System -- Address String --> Maps
    Maps -- Geocodes & Distance --> System

    System -- Image Data --> OpenAI
    OpenAI -- Verification Score --> System
```

## 2. Booking & Pricing Flow (Detailed Sequence)

Data flow for calculating price, generating estimates, and confirming a booking.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant PricingEngine as Pricing Service
    participant Maps as Maps API
    participant DB as Jobs Database
    participant Match as Matching Engine

    Note over User, PricingEngine: Step 1: Estimation
    User->>PricingEngine: Request Estimate (ServiceType, Location)
    PricingEngine->>Maps: Get Distance/Traffic Data
    Maps-->>PricingEngine: Returns: { dist_km: 5.2, time_mins: 15 }
    PricingEngine->>DB: Check Active Demand (Surge Check)
    DB-->>PricingEngine: Returns: { active_jobs: 50, online_workers: 20 }
    
    PricingEngine->>PricingEngine: Calc: (Base + 5.2*Rate) * 1.5(Surge)
    PricingEngine-->>User: Returns Estimate: $45.50

    Note over User, DB: Step 2: Confirmation
    User->>DB: Create Booking {Price: $45.50}
    DB-->>User: Booking ID: #998877
    DB->>Match: Trigger Matchmaker(Job #998877)
```

## 3. Fulfillment & Verification Flow (Detailed Sequence)

Data flow for job execution, proof submission, and AI verification.

```mermaid
sequenceDiagram
    autonumber
    participant Worker
    participant JobMgr as Job Manager
    participant AI as OpenAI Vision
    participant DB as Jobs Database
    participant Wallet as Wallet System

    Note over Worker, JobMgr: On-Site Execution
    Worker->>JobMgr: Verify OTP (Start Job)
    JobMgr->>DB: Update Status -> IN_PROGRESS
    
    Worker->>JobMgr: Mark Complete & Upload Photo
    JobMgr->>DB: Save Image URL
    
    Note over JobMgr, AI: Auto-Verification
    JobMgr->>AI: Analyze(ImageURL, ServiceContext)
    AI-->>JobMgr: Returns { confidence: 92, is_clean: true }
    
    alt Score > Threshold (80)
        JobMgr->>DB: Update Status -> COMPLETED
        JobMgr->>Wallet: Trigger Payout Calc
        Wallet->>DB: Credit Worker Wallet ($40)
        JobMgr-->>Worker: "Job Completed! Payment Processing."
    else Score Low
        JobMgr->>DB: Update Status -> DISPUTE_REVIEW
        JobMgr-->>Worker: "Verification Failed. Admin Reviewing."
    end
```

## 4. Admin & Reporting Flow (Detailed Sequence)

Data flow for administrative monitoring and dispute handling.

```mermaid
sequenceDiagram
    autonumber
    participant Admin
    participant Analytics as Analytics Engine
    participant DB as Main Database
    participant Logs as System Logs

    Note over Admin, Analytics: Performance Monitoring
    Admin->>Analytics: Get Weekly Metrics
    Analytics->>DB: Aggregation Query (Jobs, Revenue)
    DB-->>Analytics: Returns Data Rows
    Analytics-->>Admin: Visual Dashboard Data

    Note over Admin, DB: Dispute Resolution
    Admin->>DB: Fetch Disputed Job #123
    DB-->>Admin: Returns {WorkerID, ProofImg, AI_Score}
    
    Admin->>Admin: Manually Verify Image
    
    alt Admin Approves
        Admin->>DB: Force Complete Job
        DB->>Logs: Log Action "Admin Override"
    else Admin Rejects
        Admin->>DB: Cancel Job & Refund User
        DB->>Logs: Log Action "Admin Refund"
    end
```
