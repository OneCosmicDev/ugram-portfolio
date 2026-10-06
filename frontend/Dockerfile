# =============================================================================
# Ugram Frontend - Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# Using node:20-slim for glibc compatibility with lightningcss/tailwind v4

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-slim AS deps

WORKDIR /app

# Declare build argument (forwarded from docker-compose args)
ARG NEXT_PUBLIC_API_URL=http://localhost:4000

# Copy only package.json (NOT package-lock.json) to ensure fresh install
# This forces npm to download the correct platform-specific binaries
COPY package.json ./

# Install ALL dependencies including optional ones (lightningcss binaries)
RUN npm install --include=optional

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Re-declare ARG in this stage (ARGs don't carry over between stages)
ARG NEXT_PUBLIC_API_URL=http://localhost:4000

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove any copied package-lock.json to avoid conflicts
RUN rm -f package-lock.json

# Build Next.js application
# ENV bakes NEXT_PUBLIC_* into the compiled JS bundle at build time
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
