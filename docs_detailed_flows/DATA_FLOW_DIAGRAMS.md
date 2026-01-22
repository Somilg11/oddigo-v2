# Data Flow Diagrams (DFD)

This document details the flow of data and control through each micro-service/module within the InstaServe platform.

## 1. Auth Service Flow
Handles registration, login, and token generation.

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant DB as MongoDB (User/Worker)
    participant JWT as JWT Utility
    participant Email as Email Provider

    Client->>AuthController: POST /signup
    AuthController->>AuthService: signup(data)
    AuthService->>DB: Check duplicates
    AuthService->>AuthService: Hash Password (Bcrypt)
    AuthService->>DB: Create User (and WorkerProfile if needed)
    AuthService->>JWT: Sign Access & Refresh Tokens
    AuthService-->>AuthController: Return Tokens + User
    
    par Async Email
        AuthService->>Email: Send Welcome Email
    end
```

## 2. User Service Flow
Manages profile and address data.

```mermaid
sequenceDiagram
    participant User
    participant UserController
    participant UserService
    participant DB as MongoDB

    User->>UserController: POST /addresses
    UserController->>UserService: addAddress(userId, data)
    UserService->>DB: User.findById()
    UserService->>UserService: Push to addresses array
    UserService->>DB: save()
    DB-->>UserService: Updated User
    UserService-->>UserController: Return Data
```

## 3. Worker Service Flow (Onboarding & Availability)
Shows the path from signup to being "Online" (Redis).

```mermaid
sequenceDiagram
    participant Worker
    participant WorkerController
    participant WorkerService
    participant DB as MongoDB
    participant Redis

    Worker->>WorkerController: POST /onboarding
    WorkerController->>WorkerService: updateProfile(skills, vehicle)
    WorkerService->>DB: Upsert WorkerProfile
    
    Note over Worker, Redis: Going Online (Requires Verification)
    Worker->>WorkerController: POST /availability (isOnline: true)
    WorkerController->>WorkerService: toggleAvailability()
    WorkerService->>DB: Check verificationStatus == 'VERIFIED'
    
    opt Not Verified
        WorkerService-->>Worker: Error 403 Forbidden
    end
    
    WorkerService->>Redis: GEOADD workers:locations (long, lat)
    WorkerService->>DB: Update isOnline = true
```

## 4. Job Service Flow (Full Lifecycle)
The core logic engine.

```mermaid
sequenceDiagram
    participant Client
    participant JobService
    participant Pricing as PricingEngine
    participant Match as MatchingEngine
    participant DB as MongoDB
    participant Redis
    participant Socket
    participant AI as OpenAI
    participant Pay as Stripe

    Note over Client, Pricing: 1. Estimation
    Client->>JobService: POST /estimate
    JobService->>Pricing: Calculate Price
    Pricing-->>Client: Quote

    Note over Client, Redis: 2. Booking & Matching
    Client->>JobService: POST /jobs (Create)
    JobService->>DB: Save Job (CREATED)
    JobService->>Redis: GeoRadius Search (Matching)
    Redis-->>Match: Nearby Workers
    Match->>Socket: Emit 'job:offer' to Workers

    Note over Client, DB: 3. Atomic Acceptance
    Worker->>JobService: POST /accept
    JobService->>DB: findOneAndUpdate({status: MATCHING}, {status: ACCEPTED})
    DB-->>JobService: Success (Lock Acquired)

    Note over Client, Pay: 4. Completion & Payment
    Worker->>JobService: POST /complete (Proof)
    JobService->>AI: Analyze Image
    AI-->>JobService: Valid (>70%)
    JobService->>Pay: createPaymentIntent(amount)
    Pay-->>JobService: Success
    JobService->>DB: Mark COMPLETED
    JobService->>Socket: Notify User (Warranty Issued)
```

## 5. Notification Service Flow
Handles Real-time (Socket) vs Persistent (REST) notifications.

```mermaid
graph TD
    Event[System Event]
    Socket[Socket Service]
    DB[(MongoDB)]
    Client[Client App]

    Event -->|1. Real-time| Socket
    Socket -->|Emit| Client
    
    Event -->|2. Persistent| DB
    DB -->|Store Notification| DB
    
    Client -->|GET /notifications| API
    API -->|Query| DB
    DB -- "List of past alerts" --> Client
```

## 6. Admin Service Flow
Verification and System Control.

```mermaid
sequenceDiagram
    participant Admin
    participant AdminController
    participant DB as MongoDB
    participant Redis

    Note over Admin, DB: Worker Verification
    Admin->>AdminController: POST /verify-worker
    AdminController->>DB: Update WorkerProfile (status: VERIFIED)

    Note over Admin, Redis: Maintenance Mode
    Admin->>AdminController: POST /maintenance (UserApp)
    AdminController->>Redis: SET maintenance:user_app = true
    
    Note over User, Redis: User Blocked
    User->>Middleware: Requests API
    Middleware->>Redis: GET maintenance:user_app
    Redis-->>Middleware: true
    Middleware-->>User: 503 Maintenance
```
