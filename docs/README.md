# InstaServe API Documentation

## Index

- **[Authentication API](./api/AUTH.md)**
  - Signup, Login, Token Management.

- **[User API](./api/USER.md)**
  - Profile, Address Management.

- **[Worker API](./api/WORKER.md)**
  - Onboarding, Availability, Stats.

- **[Job Lifecycle API](./api/JOB.md)**
  - Booking, Matching, Execution, Amendments, Warranty.

- **[Admin API](./api/ADMIN.md)**
  - System Health, Maintenance Mode, Analytics.

- **[Real-time API](./api/SOCKET.md)**
  - Events, Tracking.

- **[Notification API](./api/NOTIFICATIONS.md)**
  - Persistent Alerts history.

## System Architecture (Detailed Flows)
- **[High-Level Design (HLD)](../docs_detailed_flows/HLD.md)**
- **[Low-Level Design (LLD)](../docs_detailed_flows/LLD.md)**
- **[ER Diagram](../docs_detailed_flows/ER_DIAGRAM.md)**
- **[Data Flow Diagrams](../docs_detailed_flows/DATA_FLOW_DIAGRAMS.md)**
- **[Combined App Flow (End-to-End)](../docs_detailed_flows/COMBINED_APP_FLOW.md)**

## Architecture & Services

The backend uses a hexagonal/adapter architecture for external services to ensure provider agnostic logic.

### Providers
| Service | Current Provider | Interface |
|---|---|---|
| **Payment** | Stripe | `IPaymentProvider` |
| **Email** | Nodemailer (SMTP) | `IEmailProvider` |
| **OTP** | Redis + Email | `IOTPProvider` |

### Maintenance Mode
Admins can toggle maintenance mode for `USER` or `WORKER` apps independently via the Admin API. This uses Redis to store state and blocks access at the middleware layer.
