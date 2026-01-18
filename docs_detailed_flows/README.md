# InstaServe: Hyper-Local Service Marketplace

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![Stack: Next.js](https://img.shields.io/badge/Stack-Next.js-black) ![Stack: TypeScript](https://img.shields.io/badge/Stack-TypeScript-blue)

## Executive Summary

**InstaServe** is a next-generation hyper-local service marketplace designed to connect customers with skilled workers (plumbers, electricians, cleaners, etc.) in real-time. Built to rival platforms like Urban Company and TaskRabbit, InstaServe leverages advanced technologies to ensure speed, trust, and efficiency.

Key differentiators include:
*   **AI-Powered Verification:** using OpenAI's Vision API to verify job completion quality.
*   **Real-Time Broadcasts:** Socket.io powered job matching that alerts nearby workers instantly.
*   **Dynamic Pricing:** A sophisticated pricing engine that adjusts for distance, demand (surge), and service complexity.

This repository contains the complete source code for the platform, encompassing the User App, Worker App, and the unified Backend API.

## Setup Instructions

Follow these steps to get the development environment running.

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/instaserve.git
cd instaserve

# Install dependencies (Monorepo root)
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your secrets.

```bash
cp .env.example .env
```

**Required Variables:**
*   `DATABASE_URL`: PostgreSQL connection string.
*   `REDIS_URL`: Redis connection string.
*   `NEXT_PUBLIC_MAPS_API_KEY`: Google Maps API Key.
*   `OPENAI_API_KEY`: For AI vision verification.
*   `STRIPE_SECRET_KEY`: For payment processing.

### 3. Database Setup

Run the following commands to set up the PostgreSQL database with Prisma.

```bash
# Generate Prisma Client
npx prisma generate

# Run Migrations
npx prisma migrate dev --name init
```

### 4. Running the App

```bash
# Start the development server (User App, Worker App, and Backend)
npm run dev
```

## Documentation

Detailed design documents are located in the `docs/detailed/` directory:

*   [**High-Level Design (HLD)**](detailed/HLD.md) - System context and high-level user flows.
*   [**Low-Level Design (LLD)**](detailed/LLD.md) - Component architecture and core logic.
*   [**Entity Relationship Diagrams (ERD)**](detailed/ER_DIAGRAMS.md) - Database schema and relationships.
*   [**Data Flow Diagrams (DFD)**](detailed/DATA_FLOW_DIAGRAMS.md) - detailed data movement analysis.
*   [**Combined System Flows**](detailed/COMBINED_FLOWS.md) - The unified big picture.

## Folder Structure

The project follows a modular structure.

```
instaserve/
├── docs_detailed_flows/
│   ├── detailed/           # Design Documents (HLD, LLD, ERD, DFD)
│   └── README.md           # This file
├── prisma/                 # Database ORM
├── src/                    # Source Code
└── ...
```
