# Stage 1: Build
FROM node:22-alpine AS builder

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

RUN --mount=type=cache,target=/root/.npm npm ci --include=dev


# Copy source code
COPY . .

# Build frontend and backend
# This runs "vite build && esbuild server/index.ts ..." as defined in package.json
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

# P1 FIX: Tini for zombie process reaping
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --only=production


# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy necessary configuration files if they are not bundled
# (Assuming esbuild bundles everything needed for server, but we might need static files if not embedded)
# The build script outputs server to dist/index.js and frontend to dist/public (based on vite config)

# Expose the port the app runs on
ENV PORT=5000
EXPOSE 5000

# Start the server
# P1 FIX: Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
