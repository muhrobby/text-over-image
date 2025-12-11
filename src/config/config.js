require("dotenv").config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
  },

  auth: {
    apiToken: process.env.API_TOKEN || null, // Set API_TOKEN in .env for authentication
    requireAuth: process.env.REQUIRE_AUTH === "true", // Enable with REQUIRE_AUTH=true
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
    backgroundColor: "rgba(0, 0, 0, 0.65)", // Lebih gelap untuk kontras lebih baik
    textColor: "#FFFFFF",
    fontFamily: "Inter, 'Segoe UI', 'DejaVu Sans', 'Noto Color Emoji', Arial, sans-serif",
    baseFontSize: 20,
    address: process.env.WATERMARK_ADDRESS || "Jakarta, Indonesia",
    
    // Advanced styling options
    panelRadius: 18,        // Border radius panel
    stripeColor: "#FFCC33", // Yellow accent color
    verifiedColor: "#00D084", // Green checkmark color
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
