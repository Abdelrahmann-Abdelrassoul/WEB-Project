
- [Overview](#overview)
- [Server Initialisation](#server-initialisation)
- [Connection Authentication](#connection-authentication)
- [Private User Rooms](#private-user-rooms)
- [Events](#events)
- [Frontend Integration](#frontend-integration)
- [Toast Notifications](#toast-notifications)
- [Navigation Badge](#navigation-badge)
- [Environment Variables](#environment-variables)
- [Sequence Diagram](#sequence-diagram)



## Overview

Socket.io runs on the same port as the Express API by sharing the underlying Node.js `http.Server` instance. This means no additional port needs to be opened — both HTTP and WebSocket traffic are handled on port `5000`.

The real-time layer is intentionally narrow in scope. It does not replace the REST API for data fetching. Its sole responsibility is delivering targeted push events to specific authenticated users so the UI can react without polling.

---

## Server Initialisation

Socket.io is initialised once at startup in `backend/server.js` after the HTTP server is created:

```js
const httpServer = createServer(app);
const io = initSocket(httpServer);
registerSocketHandlers(io);
httpServer.listen(PORT);
```

`initSocket` creates the `Server` instance and stores it as a module-level singleton. Any part of the backend that needs to emit an event imports `getIO()` to retrieve it.

```js
// backend/config/socket.js
export const initSocket = (httpServer) => { ... }  // call once at startup
export const getIO = () => { ... }                 // call anywhere to emit
```

Calling `getIO()` before `initSocket()` throws an error, preventing silent failures from import-order bugs.

**Source:** `backend/config/socket.js`, `backend/server.js`

---

## Connection Authentication

Every incoming socket connection passes through a Socket.io middleware before it is accepted. Unauthenticated connections are rejected at this layer and never reach the connection handler.

### Token resolution order

1. `socket.handshake.auth.token` — explicit token passed by the client
2. `Authorization: Bearer <token>` header
3. `token` key parsed from the `Cookie` header — this is the primary path used by the browser since the JWT is stored as an `httpOnly` cookie

### Verification steps

1. Extract the token using the resolution order above.
2. Verify with `jwt.verify(token, process.env.JWT_SECRET)`.
3. Look up the user by the decoded `id` — selects only `_id`, `username`, `email`.
4. Attach the user object to `socket.user` for use in the connection handler.
5. Call `next()` on success, or `next(new Error(...))` to reject.

Rejected sockets receive a `connect_error` event on the client side with the rejection reason and are not assigned a room.

**Source:** `backend/sockets/connectionHandler.js`

---

## Private User Rooms

On every successful connection, the server immediately calls:

```js
socket.join(userId);
```

where `userId` is the string representation of the authenticated user's MongoDB `_id`.

This creates a private named room for the user. All future targeted emissions use `io.to(userId).emit(...)`, which delivers the event only to sockets that have joined that room — i.e. only the sessions belonging to that specific account.

A user with multiple browser tabs open will have multiple sockets, all joined to the same room. An emission to the room reaches all of them simultaneously.

**Source:** `backend/sockets/connectionHandler.js`

---

## Events

### `new-like`

Emitted by the server to the video owner's private room when another user likes their video.

**Emitted from:** `backend/controllers/videoController.js` — inside the `likeVideo` controller, after the like is persisted to the database.

**Direction:** Server → Client (targeted to video owner's room)

**Payload:**

| Field | Type | Description |
|---|---|---|
| `likerUsername` | `string` | Username of the user who liked the video |
| `videoTitle` | `string` | Title of the liked video |
| `videoId` | `string` | MongoDB `_id` of the video |
| `likeCount` | `number` | Updated total like count after this like |
| `timestamp` | `string` | ISO 8601 timestamp of the event |

**Example payload:**

```json
{
  "likerUsername": "omar",
  "videoTitle": "My First Upload",
  "videoId": "69e004bad1cb4765494ea113",
  "likeCount": 42,
  "timestamp": "2026-05-01T00:00:00.000Z"
}
```

**Suppression rule:** The event is not emitted when a user likes their own video (`ownerId === likerId`).

**Error handling:** If `getIO()` throws (e.g. in a test environment where Socket.io is not initialised), the error is caught and logged. The HTTP like response is still returned successfully — the socket emission is best-effort and does not affect the REST response.

---

## Frontend Integration

The frontend connects to the Socket.io server through `SocketContext`, a React context provider mounted at the root of the application in `frontend/app/layout.jsx`.

### Connection lifecycle

| Condition | Behaviour |
|---|---|
| User logs in | `useEffect` detects `isAuthenticated === true`, opens a socket connection with `withCredentials: true` |
| User logs out | Socket is disconnected, `badgeCount` resets to `0`, toast queue is cleared |
| Component unmounts | Socket is disconnected via the `useEffect` cleanup function |
| React StrictMode double-mount | Guarded by `socketRef.current?.connected` check — only one connection is opened |

### Reconnection

The client is configured with:

```js
reconnectionAttempts: 5
reconnectionDelay: 2000
```

If the server restarts, the client attempts to reconnect up to 5 times with a 2-second delay between attempts.

### Context API

`useSocket()` exposes the following values to any component in the tree:

| Value | Type | Description |
|---|---|---|
| `socket` | `Socket \| null` | The raw Socket.io client instance |
| `badgeCount` | `number` | Count of unread engagement events |
| `clearBadge` | `() => void` | Resets `badgeCount` to `0` |
| `toasts` | `Toast[]` | Currently visible toast notifications |
| `dismissToast` | `(id) => void` | Manually dismisses a toast by id |

**Source:** `frontend/context/SocketContext.jsx`

---

## Toast Notifications

When a `new-like` event is received, a toast notification is rendered in the top-right corner of the viewport.

### Behaviour

- Slides in from the right using a CSS transition on `opacity` and `translateX`.
- Auto-dismisses after **5000ms**.
- Can be manually dismissed via the close button, which triggers a 300ms exit transition before removal.
- Multiple toasts stack vertically — each has a unique id generated from `Date.now() + Math.random()`.
- The toast container is rendered inside `SocketContext` using a fixed-position div at `z-index: 9999`, outside the normal document flow.

### Toast content for `new-like`

```
New like!
@<likerUsername> liked "<videoTitle>"
```

**Source:** `frontend/context/SocketContext.jsx` — `Toast`, `ToastContainer` components

---

## Navigation Badge

The navbar displays a red pill badge over the **Activity** bell icon when there are unread engagement events.

### Behaviour

- Increments by 1 for every incoming `new-like` event, regardless of whether the toast is still visible.
- Persists across page navigations — state lives in `SocketContext` at the root level, not in the Navbar component.
- Displays `99+` when the count exceeds 99.
- Resets to `0` when the user clicks the Activity button, which calls `clearBadge()`.
- Resets to `0` on logout.
- Rendered in both the desktop navbar and the mobile bottom navigation bar.

**Source:** `frontend/components/layout/Navbar.jsx`, `frontend/context/SocketContext.jsx`

---

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `CLIENT_URL` | `backend/.env` | Allowed CORS origin for Socket.io — must match the frontend URL exactly |
| `JWT_SECRET` | `backend/.env` | Used to verify the token during socket handshake authentication |
| `NEXT_PUBLIC_SOCKET_URL` | `frontend/.env.local` | Socket.io server URL. Defaults to `http://localhost:5000` if not set |
