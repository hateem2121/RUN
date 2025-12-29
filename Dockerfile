# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
# Install dependencies with workspace optimization
ARG NODE_ENV=production
ENV NODE_ENV=production

# P3: Docker Layer Caching Strategy
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY shared/package.json shared/

RUN npm ci --include=dev

# Copy source code
COPY . .

# Build frontend and backend
# This runs "vite build && esbuild server/index.ts ..." as defined in package.json
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy necessary configuration files if they are not bundled
# (Assuming esbuild bundles everything needed for server, but we might need static files if not embedded)
# The build script outputs server to dist/index.js and frontend to dist/public (based on vite config)

# Expose the port the app runs on
ENV PORT=5000
EXPOSE 5000

# Start the server
CMD ["node", "dist/index.js"]
