require("dotenv").config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
  },

  upload: {
    maxFileSize: "10MB",
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB in bytes
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },

  watermark: {
    position: "bottom-left",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    textColor: "#FFFFFF",
    fontFamily: "Arial",
    baseFontSize: 20,
    address: process.env.WATERMARK_ADDRESS || "Jakarta, Indonesia",
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests",
      message: "Rate limit exceeded. Try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },

  axios: {
    timeout: 30000, // 30 seconds
    maxContentLength: 10 * 1024 * 1024, // 10MB
    maxBodyLength: 10 * 1024 * 1024, // 10MB
  },
};
