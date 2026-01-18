# Entity Relationship Diagrams (ERD)

This document breaks down the data models for different domains of the system, followed by a unified schema.

## 1. Unified System Schema (Updated)

The complete overview including Warranty, Ranking, and Scope Creep extensions.

```mermaid
erDiagram
    User {
        string id PK
        string role "CUSTOMER | WORKER | ADMIN"
        float wilson_score "Indexed Ranking Score"
        enum credit_status "GREEN | RED"
        int monthly_jobs_count
    }

    Job {
        string id PK
        string status "CREATED|IN_PROGRESS|PAUSED_APPROVAL_PENDING|CANCELLED_CHARGED|COMPLETED"
        int visit_fee "Default 99"
        int final_quote_amount "Nullable"
        string amendment_reason
        string amendment_evidence_url
    }
    
    WarrantyRecord {
        string id PK
        string job_id FK
        datetime expires_at
        boolean is_active
    }

    User ||--o{ Job : "requests/performs"
    Job ||--o| WarrantyRecord : "generates"
    
    Job ||--|| Payment : "secured_by"
    Job ||--|| JobExecution : "details"
    
    Payment {
        string id PK
        decimal amount
        string status
    }
```

## 2. Worker & Fulfillment Domain (Detailed)

Focuses on worker profiles, skills, and ranking.

```mermaid
erDiagram
    Worker {
        string id PK
        string user_id FK
        float wilson_score
        float reliability_score
        int total_jobs
        int on_time_jobs
        enum credit_eligibility
    }

    JobExecution {
        string id PK
        string job_id FK
        boolean scope_amended
        int original_quote
        int final_quote
    }

    Worker ||--o{ JobExecution : performs
```
