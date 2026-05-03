const { ApiResponse } = require("../utils/response");
const { AppError } = require("../utils/errors");

const SENSITIVE_KEYS = new Set([
  "token",
  "api_token",
  "apikey",
  "api_key",
  "authorization",
  "password",
  "secret",
]);

function redactUrl(value) {
  if (typeof value !== "string" || value.length === 0) {
    return value;
  }

  try {
    const url = new URL(value, "http://localhost");
    const entries = url.searchParams.entries();
    let hasSensitive = false;

    for (const [key] of entries) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        hasSensitive = true;
        break;
      }
    }

    if (!hasSensitive) {
      return value;
    }

    const redacted = new URL(url.toString());
    for (const [key] of redacted.searchParams.entries()) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        redacted.searchParams.set(key, "[REDACTED]");
      }
    }

    return (redacted.pathname + redacted.search + redacted.hash).replace(
      /%5BREDACTED%5D/gi,
      "[REDACTED]"
    );
  } catch {
    return value
      .replace(
        /([?&](?:token|api_token|apiKey|api_key|authorization|password|secret)=)[^&#]*/gi,
        "$1[REDACTED]"
      )
      .replace(/%5BREDACTED%5D/gi, "[REDACTED]");
  }
}

function sanitizeLogData(req, err) {
  return {
    message: err.message,
    url: redactUrl(req.url),
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  };
}

const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (but sanitize sensitive data)
  const logData = sanitizeLogData(req, err);
  
  // Only log stack in development
  if (process.env.NODE_ENV === "development") {
    logData.stack = err.stack;
  }
  
  console.error("Error:", logData);

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
  sanitizeLogData,
  redactUrl,
};
