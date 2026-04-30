# ClipSphere

A short-form video platform. Users upload videos, follow each other, leave reviews, tip creators, and get notified in real time when someone likes their content.

Built with Node/Express, Next.js, MongoDB, MinIO, Socket.io, and Stripe.

---

## What's inside

```
WEB-Project/
├── docker-compose.yml        # MongoDB + MinIO
├── backend/
│   ├── server.js
│   ├── app.js
│   ├── config/               # db, minio, socket, swagger
│   ├── controllers/
│   ├── services/             # all business logic lives here
│   ├── models/               # User, Video, Review, Notification, Transaction, ...
│   ├── routes/               # auth, users, videos, tips, admin
│   ├── middleware/           # auth, error, ownership, validation
│   ├── sockets/              # Socket.io connection + room handler
│   └── scripts/              # promoteUserToAdmin, processEmailQueue
└── frontend/
    ├── app/
    │   ├── (auth)/           # login, register
    │   ├── (main)/           # home, video/:id, profile/:id, settings, earnings, admin
    │   └── tip/success/      # stripe redirect landing
    ├── components/
    ├── context/              # AuthContext, AppContext, SocketContext
    └── services/             # api wrappers
```

---

## Prerequisites

- Node.js 18+
- Docker (for MongoDB and MinIO)
- ffmpeg (`ffmpeg -version` to verify)
- Stripe CLI (for local webhook testing)

---

## Getting started

### 1. Start the infrastructure

MongoDB and MinIO run in Docker. Always start these first.

```bash
docker compose up -d
```

MinIO console → http://localhost:9001 (minioadmin / minioadmin)

If MongoDB was previously started outside of compose and is refusing connections, this fixes it:

```bash
docker compose down && docker compose up -d
```

### 2. Backend

```bash
cd backend
npm install
node server.js         # or: npm run dev  (nodemon)
```

Runs on http://localhost:5000

Swagger docs → http://localhost:5000/api-docs

### 3. Stripe CLI (needed for tips)

In a separate terminal, keep this running whenever you're testing the tip flow:

```bash
stripe listen --forward-to localhost:5000/api/v1/tips/webhook
```

Copy the `whsec_...` it prints and set it as `STRIPE_WEBHOOK_SECRET` in `backend/.env`. Without this running, tips will process on Stripe's side but the database will never update and earnings will show $0.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:3000

---

## Environment variables

### backend/.env

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/clipsphere
JWT_SECRET=your_jwt_secret

MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

CLIENT_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### frontend/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Get your Stripe test keys from https://dashboard.stripe.com/test/apikeys

---

## Features

**Videos** — upload mp4s up to 5 minutes, stream via MinIO presigned URLs, like, review, and share.

**Social** — follow/unfollow users, personalised feed, profile pages.

**Real-time** — Socket.io keeps a private room open per authenticated user. Likes trigger instant toast notifications and a persistent nav badge that clears when you visit Activity.

**Tips** — viewers can send one-time tips to creators via Stripe Checkout (test mode). Every tip is recorded in a Transaction ledger. Creators see their pending balance and full tip history at `/earnings`.

**Notifications** — email alerts via Nodemailer with per-user preference controls.

**Admin** — platform stats, user moderation, system health at `/admin`.

---

## API

All routes live under `/api/v1/`.

| Prefix | What it covers |
|---|---|
| `/auth` | register, login, logout |
| `/users` | profile, follow, settings |
| `/videos` | upload, feed, likes, reviews |
| `/tips` | checkout, webhook, balance, history |
| `/admin` | stats, health, moderation |

Full interactive docs at http://localhost:5000/api-docs

---

## Useful scripts

```bash
# promote a user to admin
npm run promote-admin

# process the email queue manually
npm run process-email-queue
```

---

## Testing tips

Use Stripe's test card — `4242 4242 4242 4242`, any future expiry, any CVC.

Make sure you're logged in as a different user than the video owner when tipping — the button doesn't render for the creator on their own video.

---

## Troubleshooting

**MongoDB ECONNREFUSED** — it's running in Docker, not as a system service. `docker compose up -d` is the only way to start it.

**Earnings show $0 after tipping** — the Stripe CLI isn't running. Start `stripe listen ...` in a separate terminal before tipping.

**Socket not connecting** — check that `CLIENT_URL` in `backend/.env` matches exactly where the frontend is running (including port).

**Port 5000 already in use** — `npx kill-port 5000`