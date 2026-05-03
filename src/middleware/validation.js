const Joi = require("joi");
const { AppError } = require("../utils/errors");
const config = require("../config/config");

// Validation schemas
const schemas = {
  fileUpload: Joi.object({
    format: Joi.string().valid("binary", "json").optional(),
    address: Joi.string().max(500).optional(),
    time_created: Joi.string().max(50).optional().messages({
      "string.max": "time_created must be less than 50 characters",
    }),
  }),

  urlUpload: Joi.object({
    url: Joi.string().uri({ scheme: ["http", "https"] }).required().messages({
      "string.uri": "Please provide a valid image URL",
      "any.required": "Image URL is required",
    }),
    address: Joi.string().max(500).optional(),
    format: Joi.string().valid("binary", "json").optional(),
    time_created: Joi.string().max(50).optional().messages({
      "string.max": "time_created must be less than 50 characters",
    }),
  }),
};

const validateFileUpload = (req, res, next) => {
  try {
    // Validate query parameters
    const { error: queryError } = schemas.fileUpload.validate(req.query);
    if (queryError) {
      throw new AppError(queryError.details[0].message, 400);
    }
    
    // Validate body parameters (address and time_created)
    const bodySchema = Joi.object({
      address: Joi.string().max(500).optional(),
      time_created: Joi.string().max(50).optional(), // Accept as string, format validated in imageService
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new AppError(bodyError.details[0].message, 400);
    }

    // Check if file exists
    if (!req.file) {
      throw new AppError("No image file provided", 400);
    }

    // Validate file size (multer already checks this, but let's double-check)
    if (req.file.size > config.upload.maxFileSizeBytes) {
      throw new AppError("File too large. Maximum size is 10MB", 400);
    }

    // Validate file type
    if (!config.upload.allowedMimeTypes.includes(req.file.mimetype)) {
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

    // URL safety checks are handled in urlFetchService before any outbound request.

    req.body = value;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateFileUpload,
  validateUrlUpload,
  schemas,
};
