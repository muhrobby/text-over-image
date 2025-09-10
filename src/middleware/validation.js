const Joi = require("joi");
const { AppError } = require("../utils/errors");

// Validation schemas
const schemas = {
  fileUpload: Joi.object({
    format: Joi.string().valid("binary", "json").optional(),
  }),

  urlUpload: Joi.object({
    url: Joi.string().uri().required().messages({
      "string.uri": "Please provide a valid image URL",
      "any.required": "Image URL is required",
    }),
    format: Joi.string().valid("binary", "json").optional(),
  }),
};

const validateFileUpload = (req, res, next) => {
  try {
    // Validate query parameters
    const { error } = schemas.fileUpload.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Check if file exists
    if (!req.file) {
      throw new AppError("No image file provided", 400);
    }

    // Validate file size (multer already checks this, but let's double-check)
    if (req.file.size > 10 * 1024 * 1024) {
      throw new AppError("File too large. Maximum size is 10MB", 400);
    }

    // Validate file type
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new AppError(
        "Invalid file format. Only JPG, PNG, and WebP are allowed",
        400
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateUrlUpload = (req, res, next) => {
  try {
    const { error, value } = schemas.urlUpload.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Additional URL validation
    const url = value.url;

    // Check if URL is from a valid domain (basic security check)
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol;

      if (!["http:", "https:"].includes(protocol)) {
        throw new AppError("Only HTTP and HTTPS URLs are allowed", 400);
      }

      // Check for suspicious domains or IPs
      const hostname = urlObj.hostname.toLowerCase();
      const suspiciousPatterns = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];

      if (suspiciousPatterns.some((pattern) => hostname.includes(pattern))) {
        throw new AppError(
          "Local URLs are not allowed for security reasons",
          400
        );
      }
    } catch (urlError) {
      if (urlError instanceof AppError) {
        throw urlError;
      }
      throw new AppError("Invalid URL format", 400);
    }

    req.body = value;
    next();
  } catch (error) {
    next(error);
  }
};

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }
    req.body = value;
    next();
  };
};

module.exports = {
  validateFileUpload,
  validateUrlUpload,
  validate,
  schemas,
};
