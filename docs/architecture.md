# System Architecture

## Overview

ClipSphere is a containerised video-sharing platform. All services run inside Docker via Docker Compose and communicate over a private bridge network. The only public entry point is Nginx on ports 80/443.

```
Browser
  │
  ▼
┌─────────────────────────────────────────┐
│  Nginx  :80 / :443  (reverse proxy)     │
│  • HTTP → HTTPS redirect                │
│  • Self-signed TLS (local dev)          │
│  • Gzip, static asset cache headers     │
└──────┬──────────┬──────────┬────────────┘
       │          │          │
       ▼          ▼          ▼
  Frontend    Backend     /storage/
  Next.js     Express      MinIO
  :3000       :5000        :9000
                │
        ┌───────┼───────┐
        ▼       ▼       ▼
     MongoDB  Redis   MinIO
      :27017  :6379   :9000

Background:
  Worker (BullMQ) ──► Redis queue ──► emailDeliveryService ──► SMTP
```

---

## Services

| Service | Image | Role |
|---|---|---|
| `nginx` | nginx:1.27-alpine | Reverse proxy, TLS termination, static caching |
| `frontend` | custom (Node 22) | Next.js 16 SSR app |
| `backend` | custom (Node 22) | Express 5 REST API + Socket.io |
| `worker` | same as backend | BullMQ email worker (separate process) |
| `mongodb` | mongo:7 | Primary database |
| `redis` | redis:7-alpine | BullMQ job queue + trending feed cache |
| `minio` | quay.io/minio/minio | S3-compatible object storage for video files |

---

## Networking

All containers share `app-network` (Docker bridge). Services reference each other by service name — no hardcoded IPs.

| Route | Resolves to |
|---|---|
| `https://localhost/` | frontend:3000 |
| `https://localhost/api/` | backend:5000 |
| `https://localhost/socket.io/` | backend:5000 (WS upgrade) |
| `https://localhost/storage/` | minio:9000 |
| `https://localhost/api-docs` | backend:5000 |

Only Nginx exposes ports to the host. MongoDB, Redis, and MinIO are internal-only.

---

## Data Flow Traces

### 1. Video feed request (trending, cached)

```
Browser → GET /api/v1/videos?feed=trending
  → Nginx proxies to backend:5000
  → videoController → listVideos()
  → cache.getCache("trending:8:0")
      HIT  → return JSON immediately (~2-4ms)
      MISS → MongoDB aggregation (~30-80ms) → setCache(60s TTL) → return JSON
```

### 2. Video upload

```
Browser → POST /api/v1/videos (multipart)
  → Nginx (client_max_body_size 500M)
  → backend uploadMiddleware (multer, memory)
  → ffprobe extracts duration
  → S3Client.PutObject → MinIO container
  → Video.create() → MongoDB
  → Socket.io broadcast to followers
  → Response 201
```

### 3. Notification email (background)

```
Action (like / comment / follow / tip)
  → notificationService.trackNotificationEvent()
  → EmailQueue.create() → MongoDB (persisted record)
  → emailQueue.add() → Redis (BullMQ job)
  → worker container picks up job
  → emailDeliveryService.processQueuedNotificationEmail()
  → nodemailer → SMTP
  → EmailQueue.status = "sent"
```

---

## Persistence

| Data | Storage | Volume |
|---|---|---|
| User accounts, videos, reviews, follows | MongoDB | `mongo_data` |
| Video/avatar files | MinIO | `minio_data` |
| BullMQ jobs, trending cache | Redis | `redis_data` |

Named Docker volumes survive container restarts and `docker compose down`. Only `docker compose down -v` destroys them.

---

## Security Notes

- Nginx is the only container with host-exposed ports (80, 443)
- JWT stored in HTTP-only cookies
- Helmet CSP, rate limiting, and mongo-sanitize on all API routes
- MinIO credentials set via environment variables, never hardcoded
- Self-signed TLS cert for local dev — replace with a real cert for production