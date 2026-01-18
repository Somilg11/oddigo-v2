# Data Flow Diagrams (DFD)

This document illustrates how data moves through the InstaServe system, using standard Data Flow Diagram notation.

*   **Square (`[...]`)**: External Entity (Source/Sink)
*   **Rounded (`(...)`)**: Process (Transformer of data)
*   **Cylinder (`[(...)]`)**: Data Store (Storage)
*   **Arrow**: Data Flow

## 1. Level 0 DFD (Context Diagram)

The system as a single black box, showing interactions with external entities.

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

## 2. Level 1 DFD: Booking & Pricing

Process decomposition of the booking phase.

```mermaid
graph LR
    User[User]
    Pricing((1.0 Pricing Process))
    Booking((2.0 Booking Process))
    Matching((3.0 Matching Process))
    
    MapsAPI[Google Maps]
    PaymentGateway[Payment Gateway]
    
    JobStore[(Jobs Database)]
    MapsCache[(Maps Cache)]

    %% Pricing Flow
    User -- Svc Type & Location --> Pricing
    Pricing -- Coordinates --> MapsAPI
    MapsAPI -- Distance Data --> Pricing
    Pricing -- Distance Data --> MapsCache
    Pricing -- Price Estimate --> User

    %% Booking Flow
    User -- Confirmed Order --> Booking
    Booking -- Charge Amount --> PaymentGateway
    PaymentGateway -- Payment Token --> Booking
    Booking -- New Job Record --> JobStore
    Booking -- Job ID & Loc --> Matching
```

## 3. Level 1 DFD: Fulfillment & Verification

Process decomposition of the job execution phase.

```mermaid
graph LR
    Worker[Worker]
    Matching((3.0 Matching Process))
    JobExecution((4.0 Execution Process))
    Verification((5.0 AI Verification))
    Payout((6.0 Payout Process))
    
    JobStore[(Jobs Database)]
    User[User]
    OpenAI[OpenAI API]

    %% Matching
    JobStore -- Pending Job Details --> Matching
    Matching -- Broadcast Alert --> Worker
    Worker -- Acceptance Signal --> Matching
    Matching -- Assignment Update --> JobStore

    %% Execution
    Worker -- OTP & Status --> JobExecution
    JobExecution -- Status Update --> JobStore
    JobExecution -- Job Started Alert --> User

    %% Verification
    Worker -- Proof Image --> Verification
    Verification -- Image Payload --> OpenAI
    OpenAI -- Confidence Score --> Verification
    Verification -- Verified Status --> JobStore
    Verification -- Completion Signal --> Payout

    %% Payout
    Payout -- Transfer Instruction --> JobStore
    Payout -- Earnings Update --> Worker
```
