# Local Deployment Guide

Step-by-step guide to run ClipSphere from a fresh machine.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker | 24+ | https://docs.docker.com/get-docker/ |
| Docker Compose | v2 (bundled) | included with Docker Desktop |
| OpenSSL | any | pre-installed on Linux/macOS |
| k6 (optional) | latest | https://k6.io/docs/get-started/installation/ |

---

## Step 1 — Clone the repository

```bash
git clone https://github.com/Abdelrahmann-Abdelrassoul/WEB-Project.git
cd WEB-Project
```

---

## Step 2 — Create the environment file

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in:

```env
JWT_SECRET=any_long_random_string_here        # required
MINIO_ROOT_USER=minioadmin                    # can leave as-is
MINIO_ROOT_PASSWORD=minioadmin                # can leave as-is
MINIO_ACCESS_KEY=minioadmin                   # must match ROOT_USER
MINIO_SECRET_KEY=minioadmin                   # must match ROOT_PASSWORD
MINIO_BUCKET_NAME=videos                      # can leave as-is
```

Leave SMTP/Stripe keys blank for local dev — emails use a no-op transport and tips will error gracefully.

---

## Step 3 — Generate the self-signed SSL certificate

```bash
sh nginx/generate-certs.sh
```

This creates `nginx/certs/cert.pem` and `nginx/certs/key.pem`. These are gitignored and never committed.

---

## Step 4 — Build and start all containers

```bash
docker compose up --build
```

First run takes 3–5 minutes. Subsequent starts use cached layers and take ~10 seconds.

---

## Step 5 — Open the app

Go to `https://localhost` in your browser. Click **"Advanced → Proceed to localhost (Risky)"** to accept the self-signed cert.

| URL | What |
|---|---|
| `https://localhost` | Frontend app |
| `https://localhost/api-docs` | Swagger API docs |
| `http://localhost` | Also works (no redirect) |

---

## Step 6 — Seed test data (optional)

To populate the trending feed with fake videos for testing:

```bash
docker exec -it backend node scripts/seedVideos.js --count=50
```

---

## Step 7 — Run the stress test (optional)

Requires k6 installed on your host machine:

```bash
k6 run --insecure-skip-tls-verify tests/k6/stress.js
```

Results are saved to `tests/k6/results.json`.

---

## Useful commands

```bash
# View all container logs
docker compose logs -f

# View a specific service
docker compose logs -f backend
docker compose logs -f worker

# Check container health
docker compose ps

# Stop everything (keeps data)
docker compose down

# Stop and wipe all data volumes
docker compose down -v

# Rebuild a single service
docker compose up --build backend

# Open a shell inside a container
docker exec -it backend sh
docker exec -it mongodb mongosh
docker exec -it redis redis-cli
```

---

## Key decisions

**Why Nginx as the only entry point?**
Keeps all services off the public network. MongoDB, Redis, and MinIO are unreachable from outside Docker — only accessible by service name on the internal bridge network.

**Why self-signed certs for local dev?**
Lets us test real HTTPS behaviour (cookie flags, mixed-content blocking, WebSocket upgrades over WSS) without a domain or a real CA. The browser warning is expected and harmless.

**Why a separate worker container?**
Email sending is slow and failure-prone. Putting it in a separate process means a crashed SMTP call never takes down the API. BullMQ retries failed jobs automatically with exponential backoff.

**Why Redis for the trending cache?**
The trending aggregation is a multi-stage MongoDB pipeline that takes 30–80ms cold. Redis brings it to 2–4ms warm. A 60s TTL means the feed refreshes frequently enough to feel live but rarely enough to not matter for performance.

**Why named Docker volumes?**
Data survives container restarts, image rebuilds, and `docker compose down`. Only an explicit `docker compose down -v` destroys it — making accidental data loss much harder.