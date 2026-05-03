require("dotenv").config();

const isProduction = (process.env.NODE_ENV || "development") === "production";
const corsOrigin = process.env.CORS_ORIGIN?.trim();
const trustProxy = process.env.TRUST_PROXY?.trim();
const allowWildcardCors = process.env.ALLOW_WILDCARD_CORS === "true";

function parseTrustProxy(value) {
  if (value == null || value === "") {
    return 1;
  }

  if (value === "true") {
    return 1;
  }

  if (value === "false") {
    return 0;
  }

  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }

  throw new Error("TRUST_PROXY must be a non-negative integer, true, or false");
}

const resolvedCorsOrigin =
  corsOrigin && corsOrigin.length > 0 ? corsOrigin : "*";

if (isProduction && resolvedCorsOrigin === "*" && !allowWildcardCors) {
  throw new Error(
    "CORS_ORIGIN=* in production requires ALLOW_WILDCARD_CORS=true"
  );
}

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
  },

  auth: {
    requireAuth: process.env.REQUIRE_AUTH === "true", // Enable with REQUIRE_AUTH=true
    apiToken: process.env.API_TOKEN?.trim() || null, // Set API_TOKEN in .env for authentication
  },

  upload: {
    maxFileSize: "10MB",
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB in bytes
    maxImagePixels: 100 * 1000 * 1000, // 100 megapixels
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },

  watermark: {
    position: "bottom-left",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    textColor: "#FFFFFF",
    fontFamily: "Inter, 'Segoe UI', 'DejaVu Sans', 'Noto Color Emoji', Arial, sans-serif",
    baseFontSize: 20,
    address: process.env.WATERMARK_ADDRESS || "Jakarta, Indonesia",

    fontRegular: process.env.WATERMARK_FONT_REGULAR || null,
    fontSemibold: process.env.WATERMARK_FONT_SEMIBOLD || null,

    panelRadius: 18,
    stripeColor: "#FFCC33",
    verifiedColor: "#00D084",
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
    origin: resolvedCorsOrigin,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },

  trustProxy: parseTrustProxy(trustProxy),

  security: {
    allowWildcardCors,
    allowHttpImages: process.env.ALLOW_HTTP_IMAGES === "true",
  },

  axios: {
    timeout: 30000, // 30 seconds
    maxContentLength: 10 * 1024 * 1024, // 10MB
    maxBodyLength: 10 * 1024 * 1024, // 10MB
  },
};

if (module.exports.auth.requireAuth && !module.exports.auth.apiToken) {
  throw new Error("API_TOKEN must be set when REQUIRE_AUTH=true");
}
