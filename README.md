# Oddigo

This is the backend for the Oddigo application, built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **Authentication**: JWT-based auth for Users, Workers, and Admins.
- **User Module**: Profile management, Search workers (Geospatial), Booking history.
- **Worker Module**: Profile, Availability, Document upload, Earnings.
- **Admin Module**: Dashboard analytics, User/Worker management.
- **Order Module**: Booking flow, OTP verification, Status updates.
- **Review Module**: Ratings and feedback system.

## Prerequisites

- Node.js (v14+)
- MongoDB (Local or Atlas)

## Setup

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file in the root directory and add the following:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/oddigo_v2
    JWT_SECRET=your_super_secret_key
    JWT_EXPIRES_IN=7d
    NODE_ENV=development
    ```
4.  **Run the server**:
    ```bash
    # Development
    npm run dev

    # Production
    npm run build
    npm start
    ```

## API Documentation

The API is structured as follows:

- `/api/v1/auth`: Authentication routes
- `/api/v1/users`: User routes
- `/api/v1/workers`: Worker routes
- `/api/v1/admin`: Admin routes
- `/api/v1/orders`: Order routes
- `/api/v1/reviews`: Review routes

## Testing

Run the following command to run tests (not yet implemented):
```bash
npm test
```
