# Low-Level Design (LLD)

This document details the internal logic and component-level architecture for the backend modules.

## 1. Core Service Modules

Detailed view of the core logic classes in the backend.

```mermaid
classDiagram
    class JobService {
        +createJob(user, data)
        +findWorkersForJob(jobId)
        +startJob(jobId, workerId)
        +requestAmendment(jobId, data)
        +completeJob(jobId, proofUrl)
    }

    class MatchingEngine {
        +findBestWorkers(lat, long, type)
        -queryRedisGeo()
        -filterBySkills()
    }

    class RankingService {
        +calculateWilsonScore(ratings)
        +updateWorkerRank(workerId)
    }
    
    class SocketService {
        +emitToUser(userId, event, data)
        +broadcastToRoom(room, event, data)
    }
    
    JobService --> MatchingEngine
    MatchingEngine --> RankingService
    JobService --> SocketService
```

## 2. External Service Abstraction (Adapter Pattern)

We use a `ServiceFactory` to decouple business logic from specific providers.

```mermaid
classDiagram
    class ServiceFactory {
        +getPaymentProvider() IPaymentProvider
        +getEmailProvider() IEmailProvider
        +getAIProvider() IAIProvider
        +getStorageProvider() IStorageProvider
    }

    class IPaymentProvider {
        <<interface>>
        +createPaymentIntent()
        +refundPayment()
    }

    class IAIProvider {
        <<interface>>
        +analyzeImage()
    }

    class StripeProvider {
        +createPaymentIntent()
    }

    class OpenAIProvider {
        +analyzeImage()
    }

    ServiceFactory ..> IPaymentProvider
    ServiceFactory ..> IAIProvider
    StripeProvider ..|> IPaymentProvider
    OpenAIProvider ..|> IAIProvider
```

## 3. Critical Algorithms

### 3.1 Dynamic Pricing
`Total = Base + (Distance * Rate) + VisitFee`
*   **Distance**: Calculated using Haversine formula (or Redis `GEODIST`).
*   **Surge**: Multiplier applied during high demand.

### 3.2 Wilson Score Ranking
Used to rank workers reliably even with few reviews.
`((p + z²/2n) - z * sqrt((p(1-p) + z²/4n)/n)) / (1 + z²/n)`
*   `p`: Positive rating ratio
*   `n`: Total ratings
*   `z`: 1.96 (95% confidence)

### 3.3 AI Verification
Middleware hook in `completeJob`:
1.  **Input**: `proofUrl` (Image)
2.  **Process**: Send to `AIProvider` with prompt "Is this completed work?".
3.  **Decision**: If confidence < 0.7, throw `AppError` and block completion (force dispute).
