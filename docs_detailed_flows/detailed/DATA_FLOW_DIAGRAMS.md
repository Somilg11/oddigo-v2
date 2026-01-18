# Data Flow Diagrams (DFD)

This document illustrates how data moves through the InstaServe system, from external entities to processes and data stores.

## 1. Level 0 DFD (Context Diagram)

The broad view of data inputs and outputs between the system and external entities.

```mermaid
graph TD
    User[User]
    Worker[Worker]
    Admin[Admin]
    System(InstaServe System)
    Bank[Payment Processor]
    Maps[Google Maps]

    User -->|Service Request| System
    User -->|Payment Info| System
    System -->|Job Status| User
    System -->|Receipt| User

    Worker -->|Location Data| System
    Worker -->|Job Acceptance| System
    System -->|Job Details| Worker
    System -->|Payout| Worker

    Admin -->|Config & Rules| System
    System -->|Reports & Alerts| Admin

    System -->|Charge Request| Bank
    Bank -->|Transaction Result| System

    System -->|Address| Maps
    Maps -->|Coordinates/Distance| System
```

## 2. User Booking Flow (Level 1)

Detailed data movement for the booking process.

```mermaid
graph LR
    User -->|1. Service & Location| PriceEngine(Pricing Process)
    PriceEngine -->|2. Distance Lookup| MapsDB[(Maps Cache)]
    PriceEngine -->|3. Calculate Price| User
    
    User -->|4. Confirm & Pay| BookingProcess(Booking Process)
    BookingProcess -->|5. Payment Token| PaymentGateway
    PaymentGateway -->|6. Success Token| BookingProcess
    
    BookingProcess -->|7. Create Job Record| JobsDB[(Jobs Database)]
    BookingProcess -->|8. Trigger Search| MatchProcess(Matchmaking Process)
```

## 3. Worker Fulfillment Flow (Level 1)

Detailed data movement for job acceptance and completion.

```mermaid
graph LR
    MatchProcess(Matchmaking Process) -->|1. Job Broadcast| Worker
    Worker -->|2. Search Criteria Match| MatchProcess
    
    Worker -->|3. Accept Job Signal| JobMgmt(Job Management)
    JobMgmt -->|4. Update Status| JobsDB[(Jobs Database)]
    JobMgmt -->|5. Notify User| User
    
    Worker -->|6. OTP Verification| JobMgmt
    Worker -->|7. Upload Proof Image| Validation(AI Validation Process)
    Validation -->|8. Analysis Request| OpenAI
    OpenAI -->|9. Confidence Score| Validation
    
    Validation -->|10. Validation Result| JobMgmt
    JobMgmt -->|11. Release Payment| WalletProcess(Wallet System)
```

## 4. Admin Management Flow (Level 1)

Detailed data movement for administrative tasks.

```mermaid
graph TD
    Admin -->|1. Request Metrics| AnalyticsDetails(Analytics Engine)
    JobsDB[(Jobs Database)] -->|2. Raw Data| AnalyticsDetails
    AnalyticsDetails -->|3. Reports| Admin
    
    Admin -->|4. Review Dispute| DisputeProcess(Dispute Resolution)
    DisputeProcess -->|5. Get Job Evidence| ValidationDB[(Evidence Store)]
    DisputeProcess -->|6. Resolution Decision| JobMgmt(Job Management)
    JobMgmt -->|7. Adjust Payout| WalletProcess
```
