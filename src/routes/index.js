const express = require("express");
const multer = require("multer");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const imageController = require("../controllers/imageController");
const {
  validateFileUpload,
  validateUrlUpload,
} = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");
const config = require("../config/config");
const { AppError } = require("../utils/errors");

const router = express.Router();

// Load OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, "../../openapi.yaml"));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Invalid file format. Only JPG, PNG, and WebP are allowed.",
          400
        ),
        false
      );
    }
  },
});

// Swagger UI Documentation
router.use("/api-docs", swaggerUi.serve);
router.get("/api-docs", swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Image Watermark API - Documentation"
}));

// API Routes
router.get("/health", imageController.healthCheck);

// Protected routes with authentication
router.post(
  "/upload",
  authenticateToken,
  upload.single("image"),
  validateFileUpload,
  imageController.uploadFile
);

router.post(
  "/upload-url",
  authenticateToken,
  validateUrlUpload,
  imageController.uploadFromUrl
);

// Home/Documentation route (JSON format)
router.get("/api", imageController.getDocumentation);

module.exports = router;
