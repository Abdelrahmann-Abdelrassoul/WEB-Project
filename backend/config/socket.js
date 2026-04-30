import { Server } from "socket.io";

let io = null;

/**
 * Initialise Socket.io against an existing HTTP server.
 * Call once from server.js after app.listen() returns the server handle.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  return io;
};

/**
 * Return the shared io instance.
 * Throws if initSocket has not been called yet (guards against import-order bugs).
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialised. Call initSocket(server) first.");
  }
  return io;
};
