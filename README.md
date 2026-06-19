# Oddigo v2

Full-stack on-demand service marketplace platform connecting Customers with skilled Workers, managed by Admins.

## How It Works

### 1. The Booking
**Alice** (Customer) has a leaky pipe. She opens the app and selects "Plumber".
- The system calculates a fair price based on distance and demand.
- Alice uploads photos/videos of the issue.
- AI analyzes the problem and provides a cost estimate.
- Alice clicks "Book Now".

### 2. The Matchmaking
The system finds workers within 10km using Redis geospatial search.
- **Bob** (Worker) is 2km away with a high Wilson Score (confidence-weighted rating).
- Bob gets a real-time notification: "New Job! Accept?"
- Bob accepts and navigates to Alice's location.

### 3. The Job
Bob drives to Alice's location.
- **Live Tracking**: Alice sees Bob moving on the map in real-time via WebSocket.
- **OTP Verification**: Bob arrives and verifies the OTP Alice shares.
- **Diagnosis**: Bob inspects the issue and submits a cost estimate.
- **Approval**: Alice reviews and approves the estimate.
- **Scope Creep**: If additional work is needed, Bob submits an amendment for approval.

### 4. The Completion
Bob fixes the issue.
- **Before/After Photos**: Bob captures photos of the work.
- **AI Verification**: OpenAI Vision checks the completion quality.
- **Digital Signature**: Alice signs to confirm satisfaction.
- **Payment**: Alice pays via UPI, Card, or Cash.
- **Warranty**: 7-day warranty issued automatically.

## Architecture

```
frontend/
  user-app/          # Customer mobile app (React + Vite)
  worker-app/        # Worker mobile app (React + Vite)
  admin-dashboard/   # Admin web panel (React + Vite)

src/                  # Backend (Node.js + Express + TypeScript)
  modules/            # Feature modules (auth, jobs, workers, admin...)
  core/               # Interfaces, factories, shared logic
  models/             # MongoDB Mongoose models
```

### Tech Stack

**Backend**: Node.js, Express, TypeScript, MongoDB, Redis, Socket.io, Docker
**Frontend**: React 19, TypeScript, Vite 7, Zustand, React Hook Form, Zod, Tailwind CSS, shadcn/ui
**External**: Stripe (payments), Cloudinary (media), OpenAI (AI analysis), Nodemailer (email)

## Quick Start

### Backend
```bash
npm install
cp .env.example .env    # Configure environment variables
npm run dev             # Start development server
```

### Frontend Apps
```bash
# Customer App (port 5173)
cd frontend/user-app && npm install && npm run dev

# Worker App (port 5174)
cd frontend/worker-app && npm install && npm run dev

# Admin Dashboard (port 5175)
cd frontend/admin-dashboard && npm install && npm run dev
```

## Documentation

- **[API Documentation](./docs/README.md)** - All backend API endpoints
- **[Frontend Implementation Plan](./docs/FRONTEND.md)** - Complete frontend guide
- **[Application Flow](./docs/FLOW.md)** - 14-step booking lifecycle
- **[Service Architecture](./docs/SERVICES.md)** - Pricing, matching, warranty
- **[System Design](./docs_detailed_flows/HLD.md)** - High-level architecture
- **[Database Design](./docs_detailed_flows/ER_DIAGRAM.md)** - Entity relationships
- **[Data Flows](./docs_detailed_flows/DATA_FLOW_DIAGRAMS.md)** - Sequence diagrams
- **[Features](./docs_detailed_flows/FEATURES.md)** - Complete feature list

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `MONGO_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` / `REFRESH_SECRET` - Authentication secrets
- `STRIPE_SECRET_KEY` - Payment processing
- `CLOUDINARY_*` - Media uploads
- `OPENAI_API_KEY` - AI analysis
