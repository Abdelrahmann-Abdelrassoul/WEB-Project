import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * Register all Socket.io connection logic.
 * Called once from server.js with the io instance.
 *
 * Join private "User Room" on connection:
 *   • Reads the JWT from the socket handshake (cookie OR auth token).
 *   • Verifies & resolves the user.
 *   • Calls socket.join(userId) so that targeted emissions can reach
 *     exactly one account's sessions.
 *   • Unauthenticated sockets are silently disconnected.
 */
export const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      // Support both cookie-based and Bearer-header-based tokens
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      // Also check cookie string (sent automatically by the browser)
      if (!token && socket.handshake.headers?.cookie) {
        const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id username email").lean();

      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user to socket for downstream use
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = String(socket.user._id);

    // join private room keyed by userId
    socket.join(userId);

    console.log(
      `[socket] user ${socket.user.username} (${userId}) connected → room "${userId}"`
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `[socket] user ${socket.user.username} (${userId}) disconnected: ${reason}`
      );
    });
  });
};
