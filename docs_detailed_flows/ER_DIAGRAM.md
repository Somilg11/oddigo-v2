# Entity Relationship Diagrams (ERD)

This document breaks down the data models for different domains of the system.

## Unified System Schema

The complete overview including Warranty, Ranking, and Scope Creep extensions.

```mermaid
erDiagram
    User {
        ObjectId _id PK
        string name
        string email
        string role "CUSTOMER|WORKER|ADMIN"
        string password
        string refreshToken
    }

    WorkerProfile {
        ObjectId _id PK
        ObjectId user FK
        boolean isOnline
        float wilsonScore
        string[] skills
        int totalJobs
    }

    Job {
        ObjectId _id PK
        ObjectId customer FK
        ObjectId worker FK
        string status "CREATED|MATCHING|IN_PROGRESS|PAUSED|COMPLETED"
        float initialQuote
        float finalQuote
        GeoJSON location
    }
    
    Amendment {
        string reason
        float proposedAmount
        string status "PENDING|APPROVED|REJECTED"
        string evidenceUrl
    }
    
    Warranty {
        ObjectId _id PK
        ObjectId job FK
        date expiresAt
        boolean isActive
    }

    User ||--o{ Job : "creates"
    User ||--o| WorkerProfile : "has"
    WorkerProfile ||--o{ Job : "performs"
    
    Job ||--o| Warranty : "generates"
    Job ||--o| Amendment : "embeds"
```
