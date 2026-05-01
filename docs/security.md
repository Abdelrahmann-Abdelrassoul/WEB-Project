
- [HTTP Security Headers](#http-security-headers)
- [CORS Policy](#cors-policy)
- [Rate Limiting](#rate-limiting)
- [Input Validation](#input-validation)
- [Authentication](#authentication)
- [NoSQL Injection Prevention](#nosql-injection-prevention)
- [Request Size Limiting](#request-size-limiting)
- [Reporting a Vulnerability](#reporting-a-vulnerability)



## HTTP Security Headers

Security headers are applied globally via [Helmet.js](https://helmetjs.github.io/) on every response.

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'` | Restricts resource loading to same origin |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Blocks clickjacking via iframes |
| `Strict-Transport-Security` | `max-age=15552000` | Enforces HTTPS (when served over TLS) |
| `X-DNS-Prefetch-Control` | `off` | Disables DNS prefetching |
| `Referrer-Policy` | `no-referrer` | Suppresses referrer information on cross-origin requests |

### CSP Relaxation for Swagger UI

The Content Security Policy is slightly relaxed on `scriptSrc` and `styleSrc` to allow the Swagger UI at `/api-docs` to load its bundled assets. This applies only to the documentation interface and does not affect API routes.

```
scriptSrc: ["'self'", "'unsafe-inline'"]
styleSrc:  ["'self'", "'unsafe-inline'", "https:"]
imgSrc:    ["'self'", "data:", "https:"]
```

**Note:** In production, `'unsafe-inline'` should be replaced with a nonce-based CSP if the Swagger UI is not publicly exposed.

**Source:** `backend/app.js`

---

## CORS Policy

Cross-Origin Resource Sharing is configured to allow requests only from the known frontend origin.

| Setting | Value |
|---|---|
| Allowed origin | `CLIENT_URL` environment variable (default: `http://localhost:3000`) |
| Credentials | Allowed (`credentials: true`) — required for httpOnly cookie auth |
| Allowed methods | `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS` |
| Allowed headers | `Content-Type`, `Authorization` |

Requests from any origin not matching `CLIENT_URL` will not receive CORS headers and will be blocked by the browser.

**Configuration:** `backend/app.js`  
**Environment variable:** `CLIENT_URL` in `backend/.env`

---

## Rate Limiting

Rate limiting is implemented using [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) and applied per IP address. Limits are tracked in memory and reset on server restart.

When a limit is exceeded the server responds with:

```
HTTP 429 Too Many Requests

{
  "status": "fail",
  "message": "Too many requests, please slow down and try again later."
}
```

Response headers `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` are included on every response so clients can track their current usage.

### Limit Table

| Limiter | Routes | Window | Max Requests | Rationale |
|---|---|---|---|---|
| `apiLimiter` | All `/api/v1/*` | 1 minute | 100 | General abuse prevention |
| `authLimiter` | `POST /api/v1/auth/login`<br>`POST /api/v1/auth/register` | 15 minutes | 10 | Brute-force and credential stuffing protection |
| `uploadLimiter` | `POST /api/v1/videos` | 1 hour | 10 | Upload pipeline (MinIO + ffmpeg) is expensive |
| `tipLimiter` | `POST /api/v1/tips/checkout` | 15 minutes | 20 | Stripe session creation spam prevention |

**Source:** `backend/config/rateLimiter.js`

---

## Input Validation

All incoming request bodies are validated using [Zod](https://zod.dev/) on the backend, independent of any client-side checks. Invalid requests are rejected before reaching business logic or the database.

### Validation Response Format

```
HTTP 400 Bad Request

{
  "status": "fail",
  "message": "<first error message>",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

### Backend Schemas

| Schema | Applied to | Key constraints |
|---|---|---|
| `registerSchema` | `POST /auth/register` | username ≥ 3 chars, valid email, password ≥ 6 chars |
| `loginSchema` | `POST /auth/login` | valid email, password ≥ 6 chars |
| `updateMeSchema` | `PATCH /users/me` | username ≥ 3 chars (optional), bio ≤ 300 chars |
| `createVideoSchema` | `POST /videos` | title 3–100 chars, description ≤ 1000 chars |
| `updateVideoSchema` | `PATCH /videos/:id` | same as create, all fields optional |
| `createReviewSchema` | `POST /videos/:id/reviews` | rating 1–5 integer, comment ≤ 500 chars |
| `updateReviewSchema` | `PATCH /videos/:id/reviews/:rid` | at least one of rating or comment required |
| `createTipSchema` | `POST /tips/checkout` | videoId required, amountCents 50–100000 (integer), message ≤ 200 chars |

**Source:** `backend/utils/validators.js`  
**Middleware:** `backend/middleware/validateMiddleware.js`

### Frontend Validation

The login and register forms perform client-side validation before any network request is made. This is a UX layer only — the backend independently validates all inputs regardless of client behaviour.

| Form | Checks performed |
|---|---|
| Login | Email required, valid email format, password required, password ≥ 6 chars |
| Register | Username required, username ≥ 3 chars, valid email, password ≥ 6 chars, passwords match |

**Source:** `frontend/app/(auth)/login/page.jsx`, `frontend/app/(auth)/register/page.jsx`

---

## Authentication

Authentication uses JSON Web Tokens (JWT) stored as `httpOnly` cookies, making them inaccessible to JavaScript and resistant to XSS-based token theft.

- Tokens are signed with `JWT_SECRET` from the environment.
- All protected routes run the `protect` middleware which verifies the token and attaches the user to `req.user`.
- Socket.io connections are authenticated using the same JWT extracted from the cookie during the handshake. Unauthenticated socket connections are rejected before joining any room.
- Passwords are hashed with bcrypt before storage. Plaintext passwords are never persisted.

**Source:** `backend/middleware/authMiddleware.js`, `backend/sockets/connectionHandler.js`

---

## NoSQL Injection Prevention

[express-mongo-sanitize](https://github.com/fiznool/express-mongo-sanitize) strips any keys beginning with `$` or containing `.` from `req.body`, `req.params`, and `req.query` before they reach the application layer. This prevents operators like `$where` or `$gt` from being injected into MongoDB queries through user-supplied input.

**Source:** `backend/app.js`

---

## Request Size Limiting

The JSON body parser is configured with a `10kb` limit:

```js
app.use(express.json({ limit: "10kb" }));
```

Requests with a body exceeding 10kb are rejected with `HTTP 413 Payload Too Large`. This limits the impact of large-payload denial-of-service attempts.

Video uploads bypass this limit intentionally — they are handled by `multer` directly and validated separately by duration and MIME type before being forwarded to MinIO.

---

## Reporting a Vulnerability

This is an educational project. If you identify a security issue, open a GitHub issue or contact the maintainers directly through the repository.