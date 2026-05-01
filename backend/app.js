import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import swaggerUi from "swagger-ui-express";
import healthRoutes from "./routes/healthRoutes.js";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import tipRoutes from "./routes/tipRoutes.js";
import swaggerSpec from "./config/swagger.js";
import { apiLimiter } from "./config/rateLimiter.js";


const app = express();

// Middleware
// Security + parsing
// Relax helmet's CSP so Swagger UI assets load correctly
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'"],
        styleSrc:   ["'self'", "'unsafe-inline'", "https:"],
        imgSrc:     ["'self'", "data:", "https:"],
      },
    },
  })
);
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true, // Allow cookies to be sent/received
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

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

// ── Swagger UI (public) ───────────────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "WEB Project API Docs",
    swaggerOptions: {
      persistAuthorization: true, // keeps the JWT between page refreshes
      docExpansion: "list",       // show all tags collapsed by default
      filter: true,               // enable endpoint search bar
      tryItOutEnabled: true,      // open "Try it out" by default
    },
  })
);

// Expose raw OpenAPI JSON for tooling / code-gen
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Routes
app.use("/api/v1", apiLimiter);
app.use("/", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/tips", tipRoutes);

// 404 + Global error handler
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;