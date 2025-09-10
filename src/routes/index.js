const express = require("express");
const multer = require("multer");
const imageController = require("../controllers/imageController");
const {
  validateFileUpload,
  validateUrlUpload,
} = require("../middleware/validation");
const config = require("../config/config");

const router = express.Router();

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
        new Error("Invalid file format. Only JPG, PNG, and WebP are allowed."),
        false
      );
    }
  },
});

// Routes
router.get("/", imageController.getDocumentation);
router.get("/health", imageController.healthCheck);

router.post(
  "/upload",
  upload.single("image"),
  validateFileUpload,
  imageController.uploadFile
);

router.post("/upload-url", validateUrlUpload, imageController.uploadFromUrl);

module.exports = router;
