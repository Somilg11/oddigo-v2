# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/cluster.js"]
