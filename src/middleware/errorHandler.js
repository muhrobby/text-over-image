const { ApiResponse } = require("../utils/response");
const { AppError } = require("../utils/errors");

const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new AppError(message, 400);
  }

  // Multer errors
  if (err instanceof Error && err.code === "LIMIT_FILE_SIZE") {
    error = new AppError("File too large. Maximum size is 10MB", 400);
  }

  if (err instanceof Error && err.code === "LIMIT_FILE_COUNT") {
    error = new AppError("Too many files. Only one file is allowed", 400);
  }

  if (err instanceof Error && err.code === "LIMIT_UNEXPECTED_FILE") {
    error = new AppError(
      'Unexpected file field. Please use "image" field name',
      400
    );
  }

  // Sharp/image processing errors
  if (
    err.message &&
    err.message.includes("Input file contains unsupported image format")
  ) {
    error = new AppError(
      "Unsupported image format. Please use JPG, PNG, or WebP",
      400
    );
  }

  // Rate limit error
  if (err.type === "entity.too.large") {
    error = new AppError("File too large. Maximum size is 10MB", 400);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Create error response
  const errorResponse = new ApiResponse(false, message, null, {
    statusCode,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  notFound,
  errorHandler,
};
