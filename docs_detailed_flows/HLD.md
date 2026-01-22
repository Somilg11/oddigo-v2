# High-Level Design (HLD)

This document provides a comprehensive high-level overview of the InstaServe platform, focusing on the system context, container architecture, and specific high-level flows.

## 1. System Context Diagram

The system interactions at the highest level, showing how external actors interact with the InstaServe platform.

```mermaid
graph TD
    User((Customer))
    Worker((Service Provider))
    Admin((Platform Admin))
    
    subgraph InstaServe_Platform
        API[Monolith API Server]
        JobEngine[Job Engine]
        AdminModule[Admin Module]
    end

    Stripe["Stripe (Payments)"]
    Redis["Redis Cache/Geo"]
    Mongo["(MongoDB)"]
    OpenAI["OpenAI Service"]
    SMTP["Email Service"]

    User -->|Books/Tracks| API
    Worker -->|Accepts/Completes| API
    Admin -->|Manages/Monitors| API

    API --> JobEngine
    API --> AdminModule
    
    JobEngine --> Redis
    JobEngine --> Mongo
    
    JobEngine --> Stripe
    JobEngine --> OpenAI
    AdminModule --> SMTP
```

## 2. Container Architecture

A breakdown of the specific applications, services, and databases.

```mermaid
graph TB
    subgraph Client_Side
        UserApp[User App]
        WorkerApp[Worker App]
        AdminPanel[Admin Dashboard]
    end

    subgraph Backend_Infrastructure
        LB[Load Balancer]
        Cluster["Node.js Cluster (Multiple Workers)"]
        
        subgraph Core_Services
            Auth[Auth Service]
            Job[Job Service]
            Socket[Socket.io Service]
            AdminSvc[Admin Service]
        end
        
        subgraph Adapters
            StripeAdp[Stripe Provider]
            EmailAdp[Nodemailer Provider]
            AIAdp[OpenAI Provider]
            StorageAdp[Cloudinary Provider]
        end
    end

    subgraph Data_Storage
        MainDB[(MongoDB)]
        Cache[(Redis)]
    end

    UserApp --> LB
    WorkerApp --> LB
    AdminPanel --> LB

    LB --> Cluster
    Cluster --> Auth
    Cluster --> Job
    Cluster --> AdminSvc
    Cluster --> Socket
    
    Job --> StripeAdp
    Job --> AIAdp
    Job --> StorageAdp
    
    Auth --> EmailAdp
    
    Cluster --> MainDB
    Cluster --> Cache
```

## 3. User Flow HLD

The high-level journey of a customer.

```mermaid
graph LR
    Login[Login/Signup] --> Home[Home Screen]
    Home --> Select[Select Service]
    Select --> Estimate[Get Price Estimate]
    Estimate --> Book[Confirm Booking]
    Book --> Match[Find Worker]
    Match --> Track[Live Tracking]
    
    Track --> ScopeCheck{Scope Creep?}
    ScopeCheck -- Yes --> Review{Review Request}
    Review -- Approve --> Update[Update Price]
    Review -- Reject --> Cancel[Cancel Job]
    
    ScopeCheck -- No --> Complete[Job Completion]
    Complete --> Warranty[Warranty Issued]
```

## 4. Worker Flow HLD

The high-level journey of a service provider.

```mermaid
graph LR
    Online[Go Online] --> Wait[Wait for Requests]
    Wait --> Offer[Receive Job Offer]
    Offer --> Accept["Accept Job (Race)"]
    Accept --> Nav[Navigate]
    Nav --> Start[Start Job]
    
    Start --> Inspect{Inspection}
    Inspect -- Issues --> Amend[Request Amendment]
    Amend --> WaitApp[Wait Approval]
    
    Inspect -- OK --> Work[Perform Work]
    WaitApp --> Work
    
    Work --> Verify[Upload Proof]
    Verify --> Finish[Complete Job]
```
