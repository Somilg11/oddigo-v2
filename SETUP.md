# Backend Setup Guide

## 🐳 Run with Docker (Recommended)

This project is fully dockerized, allowing you to run the entire stack (API, MongoDB, Redis) without installing Node.js or databases locally.

### Prerequisites
- **Docker Desktop** (running)

### Quick Start
To start the backend server and all dependencies:

```bash
docker-compose up -d --build
```

This command will:
1.  Build the backend API image.
2.  Start **MongoDB** container.
3.  Start **Redis** container.
4.  Start **Backend API** container on port `3000`.

### Verification
- **Health Check**:
  ```bash
  curl http://localhost:3000/health
  # Output: {"status":"UP", ...}
  ```
- **View Logs**:
  ```bash
  docker-compose logs -f api
  ```

### Stopping the Server
To stop and remove containers:
```bash
docker-compose down
```

---

## 🛠 Development Notes

The Docker container runs the compiled JavaScript code.
If you make changes to TypeScript files (`src/**/*.ts`), you must **rebuild** the container to see changes:

```bash
docker-compose up -d --build api
```
