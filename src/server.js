const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const config = require("./config/config");
const routes = require("./routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const morgan = require("morgan");

const app = express();

// Trust first proxy (required when behind reverse proxies like Codespaces/NGINX)
// Ensures rate limiter and req.ip work with X-Forwarded-For
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
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

// Routes
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
