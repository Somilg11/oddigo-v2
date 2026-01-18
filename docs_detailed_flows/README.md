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

## Folder Structure

The project follows a modular structure using Next.js App Router.

```
instaserve/
├── prisma/                 # Database ORM
│   └── schema.prisma       # Database Schema
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router (Routes & Pages)
│   │   ├── api/            # Backend API Routes
│   │   ├── (user)/         # User-facing app routes
│   │   └── (worker)/       # Worker-facing app routes
│   ├── components/         # React Components (UI, Shared)
│   ├── lib/                # Library configurations (Redis, Stripe, OpenAI)
│   ├── services/           # Business Logic Services (Socket, Matchmaking)
│   ├── utils/              # Helper functions (Pricing, Formatting)
│   └── types/              # TypeScript definitions
├── docs/                   # Documentation & Architecture
├── .env.example            # Env variable template
├── next.config.js          # Next.js Config
├── package.json            # Dependencies & Scripts
└── tailwind.config.ts      # Styling Configuration
```
