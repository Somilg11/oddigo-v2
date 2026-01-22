# 🚀 InstaServe Backend (Oddigo V2)

Welcome to **InstaServe**, the backend engine powering a next-gen On-Demand Service marketplace.

Think of this as the "Brain" 🧠 that connects Customers who need help with Workers who have skills.

## 📖 The Story: How it Works

### 1. The Booking 📅
**Alice** (Customer) has a leaky pipe. She opens the app and selects "Plumber".
- **The Brain** calculates a fair price instantly (based on distance and demand).
- Alice clicks **"Book Now"**.

### 2. The Matchmaking 🤝
The system knows the location of every active Plumber.
- It finds **Bob** (Worker), who is 2km away and has a 5-star rating (High Wilson Score).
- Bob gets a notification: *"New Job! $50. Accept?"*
- Bob accepts.

### 3. The Job 🛠️
Bob drives to Alice's house.
- **Tracking**: Alice sees Bob moving on the map in real-time.
- **Start**: Bob arrives and verifies the OTP Alice gives him.
- **Scope Creep**: Bob realizes the pipe is *really* broken. He requests an amendment (+$20) via the app. Alice approves it.

### 4. The Completion ✅
Bob fixes the leak.
- **Proof**: Bob takes a photo of the dry pipe.
- **AI Check**: Our AI (OpenAI Vision) checks the photo. *"Looks good!"*
- **Payment**: Alice is charged, Bob gets paid.
- **Warranty**: The system issues a 7-day warranty to Alice automatically.

---

## 🛠️ For Developers

### Quick Start
1.  **Install**: `npm install`
2.  **Environment**: Create `.env` (see `.env.example`)
3.  **Run**: `npm run dev` (or `npm run cluster` for production)
4.  **Docs**: Read the **[Detailed Documentation](./docs/README.md)** for API endpoints.

### Key Technology
-   **Node.js & Express**: The fast, scalable server.
-   **MongoDB**: Storing users and jobs.
-   **Redis**: Super-fast caching and Geo-tracking.
-   **Socket.io**: Real-time updates (like the map tracking).
-   **Docker**: Runs everything in containers.

### Architecture View
We use a **Hexagonal Architecture**. This means our core business logic doesn't care if we use Stripe or PayPal, AWS or Google Cloud. We use "Adapters" to plug them in.

[View Detailed Diagrams](./docs_detailed_flows/COMBINED_APP_FLOW.md)
