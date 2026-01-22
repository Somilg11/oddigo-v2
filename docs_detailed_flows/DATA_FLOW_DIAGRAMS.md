# Data Flow Diagrams (DFD)

This document details the flow of data and control through the components.

## 1. System Context (Level 0)

The high-level exchange of data between the System and External Entities.

```mermaid
graph TD
    User[User]
    Worker[Worker]
    Admin[Admin]
    System((InstaServe System))
    
    Stripe[Stripe]
    OpenAI[OpenAI]
    Maps[Google Maps]

    User -- "Request Service" --> System
    System -- "Booking Status" --> User
    
    Worker -- "Location/Status" --> System
    System -- "Job Offer" --> Worker

    System -- "Payment Intent" --> Stripe
    System -- "Image Analysis" --> OpenAI
```

## 2. Job Processing Data Flow (Level 1)

Data flow for calculating price, finding workers, and managing state.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Pricing as Pricing Engine
    participant Match as Matching Engine
    participant Rank as Ranking Service
    participant Socket as Socket Service

    User->>Pricing: Request Estimate (Type, Loc)
    Pricing-->>User: Return Quote ($)
    
    User->>Match: Create Job
    Match->>Match: Query Redis (GeoRadius)
    Match->>Rank: Sort Candidates (Wilson Score)
    Rank-->>Match: Ranked Workers list
    
    loop Top Candidates
        Match->>Socket: Emit 'job:offer'
    end
```
