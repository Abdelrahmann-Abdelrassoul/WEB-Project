# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Install ffmpeg (needed by fluent-ffmpeg at runtime)
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm ci --omit=dev

# ─── Stage 2: production image ─────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# ffmpeg must be present in the final image too
RUN apk add --no-cache ffmpeg

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create temp upload dir with correct ownership
RUN mkdir -p /app/.tmp-uploads && chown -R appuser:appgroup /app/.tmp-uploads

USER appuser

EXPOSE 5000

CMD ["node", "server.js"]