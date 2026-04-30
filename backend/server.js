import "./config/env.js";
import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { ensureBucketExists } from "./config/minio.js";
import { initSocket } from "./config/socket.js";
import { registerSocketHandlers } from "./sockets/connectionHandler.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await ensureBucketExists();

  // Wrap Express in a plain HTTP server so Socket.io can share the same port
  const httpServer = createServer(app);

  // Initialise Socket.io and register room / event handlers
  const io = initSocket(httpServer);
  registerSocketHandlers(io);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.io listening on port ${PORT}`);
  });
};

startServer();

// handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});