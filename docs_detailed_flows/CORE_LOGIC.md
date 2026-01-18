# Core Logic Implementation Strategy

This document outlines the algorithms and logic driving the key features of InstaServe.

## 1. Dynamic Pricing Algorithm

The pricing engine is designed to be fair yet profitable, accounting for variable costs and demand. The final price is calculated on the server side to prevent tampering.

**Formula:**
`Total Price = Base Price + (Distance * Rate/km) + Surge Multiplier`

**TypeScript Implementation Logic:**
```typescript
interface PricingParams {
  basePrice: number;
  distanceKm: number;
  activeWorkers: number;
  pendingJobs: number;
}

function calculatePrice(params: PricingParams): number {
  const DISTANCE_RATE = 5.0; // $5 per km
  
  // Surge Calculation
  let surge = 1.0;
  const demandRatio = params.pendingJobs / (params.activeWorkers || 1);
  
  if (demandRatio > 1.5) surge = 1.2; // 1.2x if active jobs significantly exceed workers
  if (demandRatio > 3.0) surge = 1.5; // Warning level surge

  // Final Calc
  const distanceCost = params.distanceKm * DISTANCE_RATE;
  const total = (params.basePrice + distanceCost) * surge;

  return Math.round(total * 100) / 100; // Return 2 decimal precision
}
```

## 2. AI Verification Hook

To ensure quality control without human intervention, we use OpenAI's GPT-4 Vision capabilities. Before a job is marked "Complete", the worker must upload a photo of the finished work.

**Workflow:**
1.  Worker uploads image to S3.
2.  Server triggers OpenAI API with the image URL and a system prompt.
3.  OpenAI analyzes the image against the context of the service (e.g., "Is this sink clean?").
4.  If the confidence score is high, auto-approve; otherwise, flag for manual review.

**Prompt Strategy:**
> "You are a quality assurance AI. Analyze this image of a [Service Type]. specific criteria: [Cleaning Checklist]. Return a JSON response with 'is_satisfactory': boolean and 'confidence_score': number (0-100)."

## 3. Geolocation & Matchmaking

We utilize **PostGIS** (PostgreSQL extension) for efficient geospatial queries. This allows us to find workers effectively without complex external dependencies.

**Strategy:**
1.  **Storage:** Store User and Worker locations as `Geography(Point)` types in Postgres.
2.  **Indexing:** Create a spatial index (`GIST`) on the location column for sub-millisecond query performance.
3.  **Querying:** Use `ST_DWithin` to find available workers within a specific radius (e.g., 10km).

**SQL Logic Snippet:**
```sql
SELECT id, name, location 
FROM "User" 
WHERE role = 'WORKER' 
  AND is_online = true 
  AND ST_DWithin(
    location, 
    ST_MakePoint($user_long, $user_lat)::geography, 
    10000 -- 10km radius in meters
  );
```
