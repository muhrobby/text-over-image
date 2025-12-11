const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const config = require("./config/config");
const routes = require("./routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const morgan = require("morgan");

const app = express();

// Trust first proxy (required when behind reverse proxies like Codespaces/NGINX)
// Ensures rate limiter and req.ip work with X-Forwarded-For
app.set('trust proxy', 1);

// Security middleware with CSP for inline scripts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
    },
  },
}));
app.use(cors(config.cors));

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

app.use(morgan('combined'));

// Body parser
app.use(express.json({ limit: config.upload.maxFileSize }));
app.use(
  express.urlencoded({ extended: true, limit: config.upload.maxFileSize })
);

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use("/", routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}`);
  console.log(`💖 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
