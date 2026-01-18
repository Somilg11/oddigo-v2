# Data Flow & Interaction Diagrams

This document details the flow of data and control through the InstaServe system.

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

## 2. Booking & Pricing Flow (Detailed Sequence)

Data flow for calculating price, generating estimates, and confirming a booking.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant PricingEngine as Pricing Service
    participant Match as Matching Engine
    participant Rank as Ranking Service

    User->>PricingEngine: Request Estimate
    PricingEngine-->>User: Returns Estimate
    
    User->>Match: Confirm Booking
    Match->>Rank: Get Best Workers (Wilson Score)
    Rank-->>Match: Returns Sorted List
    Match->>Match: Filter & Broadcast
```

## 3. Scope Creep & Amendment Flow (New)

Data flow for handling price hikes during a job execution.

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
