import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import healthRoutes from "./routes/healthRoutes.js";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";


const app = express();

// Middleware
// Security + parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Logging
app.use(morgan("dev"));

// Prevent NoSQL injection
app.use((req, res, next) => { // Create a new object to hold sanitized query parameters
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(mongoSanitize());

// Routes
app.use("/", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/videos", videoRoutes);

// 404 + Global error handler
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;