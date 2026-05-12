import AppError from "../utils/appError.js";

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const globalErrorHandler = (err, req, res, next) => {
  // #147 / #148 — MongoDB duplicate-key error (E11000)
  // Triggered when a user tries to like or review the same video twice and
  // the DB-level unique index rejects the write before the service layer can.
  if (err.code === 11000 || err.name === "MongoServerError" && err.code === 11000) {
    const keyPattern = err.keyPattern ? Object.keys(err.keyPattern) : [];
    let message = "Duplicate entry — this action has already been performed.";

    if (keyPattern.includes("user") && keyPattern.includes("video")) {
      // Distinguish between likes and reviews by collection name in the error
      const ns = err.keyValue ? JSON.stringify(err.keyValue) : "";
      message = "You have already performed this action on this video.";
    }

    return res.status(409).json({
      status: "fail",
      message,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message).join(". ");
    return res.status(400).json({
      status: "fail",
      message: messages,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "fail",
      message: `Invalid value for field: ${err.path}`,
    });
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: err.status || "error",
    message: err.message || "Something went wrong",
  });
};

export { notFoundHandler, globalErrorHandler };