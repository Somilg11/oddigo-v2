# System Architecture

This document details the technical architecture of InstaServe, including high-level design, database schema, state management, and interaction flows.

## 1. High-Level Architecture (HLD)

The system is built on a Next.js full-stack framework, utilizing Edge functions for low-latency responses and a centralized Node.js/PostgreSQL backend for data persistence and complex logic.

```mermaid
graph TD
    subgraph Client_Layer
        UserApp[User Mobile/Web App]
        WorkerApp[Worker Mobile/Web App]
    end

    subgraph Edge_Layer
        NextEdge[Next.js Edge Network]
        Auth[Auth Service (NextAuth)]
    end

    subgraph Core_Services
        API[Monolithic API Routes]
        Matchmaker[Matchmaking Engine]
        Pricing[Pricing Engine]
        Payment[Payment Service]
        Socket[Socket.io Server]
        AICheck[AI Verification Service]
    end

    subgraph Data_Layer
        Postgres[(PostgreSQL DB)]
        Redis[(Redis Cache)]
        S3[(AWS S3 Storage)]
    end

    subgraph External_Services
        MapsAPI[Google Maps API]
        OpenAI[OpenAI Vision API]
        Stripe[Stripe/Razorpay]
    end

    UserApp --> NextEdge
    WorkerApp --> NextEdge
    NextEdge --> Auth
    NextEdge --> API

    API --> Matchmaker
    API --> Pricing
    API --> Payment
    API --> AICheck

    Matchmaker --> MapsAPI
    Matchmaker --> Redis
    Pricing --> MapsAPI

    AICheck --> OpenAI
    Payment --> Stripe

    API --> Postgres
    API --> Redis
    API --> Socket

    Socket -.-> UserApp
    Socket -.-> WorkerApp
```

## 2. Database Schema (ERD)

We use a relational model to maintain strict data integrity, particularly for financial transactions and job states.

```mermaid
erDiagram
    User ||--o{ Job : "requests"
    User ||--o{ Payment : "makes"
    User ||--o{ Review : "writes"
    User {
        string id PK
        string email
        string role "CUSTOMER | WORKER | ADMIN"
        float rating
        point location
    }

    ServiceNiche ||--|{ ServiceSubtype : "contains"
    ServiceNiche {
        string id PK
        string name
        string icon
    }

    ServiceSubtype ||--o{ Job : "defines"
    ServiceSubtype {
        string id PK
        string name
        decimal base_price
    }

    Job ||--o| Payment : "has"
    Job ||--o{ Review : "receives"
    Job {
        string id PK
        string status
        decimal final_price
        timestamp scheduled_at
        string verification_image_url
    }

    Payment {
        string id PK
        decimal amount
        string status
        string gateway_id
    }

    Review {
        string id PK
        int stars
        string comment
    }
```

## 3. Job State Machine (LLD)

The lifecycle of a service request (Job) is strictly managed to prevent invalid transitions (e.g., paying for a cancelled job).

```mermaid
stateDiagram-v2
    [*] --> Created: User Request
    Created --> Assigned: Worker Accepts
    Assigned --> InProgress: Worker Arrives & OTP Verified
    
    state InProgress {
        [*] --> Working
        Working --> Reviewing: Job Done & Photo Uploaded
    }

    Reviewing --> Completed: AI Score > 80%
    Reviewing --> Disputed: AI Score < 80% / User Rejects

    Completed --> [*]: Payment Succeeded
    Disputed --> [*]: Admin Manual Review
```

## 4. Sequence Diagram (Booking Flow)

The flow from a user requesting an estimate to a worker accepting the job.

```mermaid
sequenceDiagram
    participant User
    participant API
    participant PricingEngine
    participant Database
    participant PaymentGateway
    participant SocketService
    participant Worker

    User->>API: Request Estimate (Service, Location)
    API->>PricingEngine: Calculate Price (Base + Distance + Surge)
    PricingEngine-->>API: Return Total Price
    API-->>User: Show Estimate

    User->>API: Confirm Booking
    API->>PaymentGateway: Hold Amount / Auth Charge
    PaymentGateway-->>API: Success

    API->>Database: Create Job (Status: Created)
    API->>Database: Find Workers in Radius
    
    loop Broadcast
        API->>SocketService: Emit 'NEW_JOB' to qualified Workers
        SocketService->>Worker: Notification Push
    end

    Worker->>API: Accept Job
    API->>Database: Update Job (Status: Assigned)
    API->>SocketService: Notify User "Worker Found"
    SocketService->>User: Update UI
```
