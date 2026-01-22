# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
# Install all dependencies (including devDeps for build)
RUN npm install

COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/dist ./dist
# Copy other necessary files if any (like .env example or config templates)

EXPOSE 3000

# Use Cluster mode by default for production performance
CMD ["node", "dist/cluster.js"]
