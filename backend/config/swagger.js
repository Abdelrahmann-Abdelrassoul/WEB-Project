import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WEB Project API",
      version: "1.0.0",
      description:
        "Interactive API documentation for the WEB Project — covering Auth, Users, Videos, Reviews, and Admin endpoints.",
      contact: {
        name: "WEB Project Team",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1",
      },
    ],
    components: {
      securitySchemes: {
        CookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token stored in HTTP-only cookie. Set automatically after login.",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            'Alternative: Enter your JWT token manually. For normal usage, use CookieAuth.',
        },
      },
      schemas: {
        // ─── Auth ────────────────────────────────────────────────────────────
        RegisterRequest: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: {
              type: "string",
              minLength: 3,
              maxLength: 30,
              example: "john_doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              format: "password",
              example: "secret123",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "secret123",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
          description: "Token is automatically set as an HTTP-only cookie. Not visible in response body.",
        },

        // ─── User ─────────────────────────────────────────────────────────────
        NotificationChannel: {
          type: "object",
          properties: {
            followers: { type: "boolean", example: true },
            comments:  { type: "boolean", example: true },
            likes:     { type: "boolean", example: true },
            tips:      { type: "boolean", example: false },
          },
        },
        NotificationPreferences: {
          type: "object",
          properties: {
            inApp:  { $ref: "#/components/schemas/NotificationChannel" },
            email:  { $ref: "#/components/schemas/NotificationChannel" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id:       { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            username:  { type: "string", example: "john_doe" },
            email:     { type: "string", format: "email", example: "john@example.com" },
            role:      { type: "string", enum: ["user", "admin"], example: "user" },
            bio:       { type: "string", example: "I love videos!" },
            avatarKey: { type: "string", example: "avatars/john_doe.jpg" },
            active:    { type: "boolean", example: true },
            accountStatus: {
              type: "string",
              enum: ["active", "suspended", "banned"],
              example: "active",
            },
            notificationPreferences: {
              $ref: "#/components/schemas/NotificationPreferences",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        UpdateMeRequest: {
          type: "object",
          properties: {
            username:  { type: "string", minLength: 3, example: "new_username" },
            bio:       { type: "string", maxLength: 300, example: "Updated bio" },
            avatarKey: { type: "string", example: "avatars/new_avatar.jpg" },
          },
        },
        UpdateNotificationPreferencesRequest: {
          type: "object",
          required: ["inApp", "email"],
          properties: {
            inApp: { $ref: "#/components/schemas/NotificationChannel" },
            email: { $ref: "#/components/schemas/NotificationChannel" },
          },
        },
        Follow: {
          type: "object",
          properties: {
            _id:       { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d2" },
            follower:  { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            following: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d3" },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ─── Video ────────────────────────────────────────────────────────────
        Video: {
          type: "object",
          properties: {
            _id:         { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0e1" },
            title:       { type: "string", example: "My Awesome Video" },
            description: { type: "string", example: "A short description of the video." },
            owner:       { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            videoURL:    { type: "string", example: "https://cdn.example.com/videos/abc.mp4" },
            duration:    { type: "number", example: 120 },
            viewscount:  { type: "number", example: 0 },
            status: {
              type: "string",
              enum: ["public", "private", "flagged"],
              example: "public",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateVideoRequest: {
          type: "object",
          required: ["videoURL", "duration"],
          properties: {
            title:       { type: "string", minLength: 3, example: "My Awesome Video" },
            description: { type: "string", maxLength: 1000, example: "Video description." },
            videoURL:    { type: "string", example: "https://cdn.example.com/videos/abc.mp4" },
            duration:    { type: "number", minimum: 1, maximum: 300, example: 120 },
          },
        },
        UpdateVideoRequest: {
          type: "object",
          properties: {
            title: {
              type: "string",
              minLength: 3,
              maxLength: 100,
              example: "Updated Title",
            },
            description: { type: "string", maxLength: 1000, example: "New description." },
            status: {
              type: "string",
              enum: ["public", "private", "flagged"],
              example: "private",
            },
          },
        },

        // ─── Review ───────────────────────────────────────────────────────────
        Review: {
          type: "object",
          properties: {
            _id:     { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0f1" },
            rating:  { type: "integer", minimum: 1, maximum: 5, example: 4 },
            comment: { type: "string", example: "Great video!" },
            user:    { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            video:   { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0e1" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateReviewRequest: {
          type: "object",
          required: ["rating"],
          properties: {
            rating:  { type: "integer", minimum: 1, maximum: 5, example: 4 },
            comment: { type: "string", maxLength: 500, example: "Great video!" },
          },
        },

        // ─── Admin ────────────────────────────────────────────────────────────
        AdminStats: {
          type: "object",
          properties: {
            totalUsers:     { type: "integer", example: 1024 },
            totalVideos:    { type: "integer", example: 342 },
            flaggedVideos:  { type: "integer", example: 5 },
            suspendedUsers: { type: "integer", example: 3 },
          },
        },
        PatchUserStatusRequest: {
          type: "object",
          required: ["accountStatus"],
          properties: {
            accountStatus: {
              type: "string",
              enum: ["active", "suspended", "banned"],
              example: "suspended",
            },
          },
        },

        // ─── Shared error / success ───────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            status:  { type: "string", example: "success" },
            results: { type: "integer", example: 5 },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status:  { type: "string", example: "fail" },
            message: { type: "string", example: "Something went wrong." },
          },
        },
      },

      // ─── Reusable responses ─────────────────────────────────────────────────
      responses: {
        Unauthorized: {
          description: "Unauthorized — missing or invalid JWT token (in cookie or Bearer header)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { status: "fail", message: "You are not logged in. Please provide a token." },
            },
          },
        },
        Forbidden: {
          description: "Forbidden — insufficient role",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { status: "fail", message: "You do not have permission to perform this action." },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { status: "fail", message: "Resource not found." },
            },
          },
        },
        ValidationError: {
          description: "Validation error — request body failed schema validation",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { status: "fail", message: "username: Username must be at least 3 characters" },
            },
          },
        },
      },

      // ─── Reusable parameters ────────────────────────────────────────────────
      parameters: {
        userId: {
          name: "id",
          in: "path",
          required: true,
          description: "MongoDB ObjectId of the user",
          schema: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
        },
        videoId: {
          name: "id",
          in: "path",
          required: true,
          description: "MongoDB ObjectId of the video",
          schema: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0e1" },
        },
        pageQuery: {
          name: "page",
          in: "query",
          required: false,
          description: "Optional page number fallback. Used only when skip is not provided.",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        limitQuery: {
          name: "limit",
          in: "query",
          required: false,
          description: "Items per page (default: 20, max: 50)",
          schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        },
        skipQuery: {
          name: "skip",
          in: "query",
          required: false,
          description: "Number of videos to skip before returning the next chunk (default: 0)",
          schema: { type: "integer", minimum: 0, default: 0 },
        },
      },
    },

    security: [{ CookieAuth: [] }],

    tags: [
      { name: "Auth",   description: "Register and log in — token is set as HTTP-only cookie" },
      { name: "Users",  description: "User profile and social features" },
      { name: "Videos", description: "Video CRUD and reviews" },
      { name: "Admin",  description: "Admin-only management endpoints (requires admin role)" },
    ],
  },
  // Glob patterns for files that contain JSDoc @swagger annotations
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
