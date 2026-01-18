# Entity Relationship Diagrams (ERD)

This document breaks down the data models for different domains of the system, followed by a unified schema.

## 1. User & Service Domain ERD

Focuses on how users interact with services and specific job requests.

```mermaid
erDiagram
    User {
        string id PK
        string name
        string email
        string phone
        geography location
        string stripe_customer_id
    }

    ServiceCategory {
        string id PK
        string name
        string icon_url
    }

    ServiceMetadata {
        string id PK
        string name
        decimal base_price_per_hour
        string category_id FK
    }

    JobRequest {
        string id PK
        string user_id FK
        string service_id FK
        timestamp requested_at
        float estimated_price
        string status
    }

    User ||--o{ JobRequest : creates
    ServiceCategory ||--|{ ServiceMetadata : contains
    ServiceMetadata ||--o{ JobRequest : defines
```

## 2. Worker & Fulfillment Domain ERD

Focuses on worker profiles, skills, and actual job execution.

```mermaid
erDiagram
    Worker {
        string id PK
        string user_id FK
        boolean is_verified
        boolean is_online
        float current_lat
        float current_long
        float rating
    }

    WorkerSkill {
        string id PK
        string worker_id FK
        string service_id FK
        boolean is_verified
    }

    JobExecution {
        string id PK
        string job_request_id FK
        string worker_id FK
        timestamp accepted_at
        timestamp started_at
        timestamp completed_at
        string proof_image_url
        float ai_verification_score
    }

    Worker ||--o{ WorkerSkill : possesses
    Worker ||--o{ JobExecution : performs
    JobExecution ||--|| JobRequest : fulfills
```

## 3. Admin & Operations ERD

Focuses on disputes, payments, and system logs.

```mermaid
erDiagram
    AdminUser {
        string id PK
        string email
        string role "SUPER_ADMIN | SUPPORT"
    }

    Dispute {
        string id PK
        string job_id FK
        string reason
        string status "OPEN | RESOLVED"
        string admin_id FK
    }

    PaymentTransaction {
        string id PK
        string job_id FK
        string payer_id FK
        string payee_id FK
        decimal amount
        string currency
        string status
        timestamp created_at
    }

    SystemLog {
        string id PK
        string event_type
        json metadata
        timestamp created_at
    }

    AdminUser ||--o{ Dispute : resolves
    Dispute }|--|| JobExecution : contests
    PaymentTransaction }|--|| JobExecution : settles
```

## 4. Unified System Schema

The complete overview of all major entities and their relationships.

```mermaid
erDiagram
    User ||--o| Worker : "can be"
    User ||--o{ JobRequest : "books"
    Worker ||--o{ JobExecution : "fulfills"
    JobRequest ||--o| JobExecution : "becomes"
    
    ServiceCategory ||--|{ ServiceMetadata : "has"
    ServiceMetadata ||--o{ JobRequest : "type of"
    
    JobExecution ||--o{ PaymentTransaction : "generates"
    JobExecution ||--o| Dispute : "may have"
    JobExecution ||--o{ Review : "gets"

    Review {
        string id PK
        int rating
        string comment
    }
```
