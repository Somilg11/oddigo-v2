# Authentication Module

## Overview
Handles registration and login for Users, Workers, and Admins using JWT.

## Endpoints

### User
- `POST /api/v1/auth/register/user`: Register a new user.
- `POST /api/v1/auth/login/user`: Login as user.

### Worker
- `POST /api/v1/auth/register/worker`: Register a new worker.
- `POST /api/v1/auth/login/worker`: Login as worker.

### Admin
- `POST /api/v1/auth/login/admin`: Login as admin.

## Schemas
See `src/modules/auth/auth.validation.ts` for request body validation rules.
