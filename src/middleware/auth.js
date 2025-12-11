const { AppError } = require("../utils/errors");
const config = require("../config/config");

/**
 * Middleware untuk API Token Authentication
 * Token dikirim via header: Authorization: Bearer <token>
 * atau via query parameter: ?token=<token>
 */
const authenticateToken = (req, res, next) => {
  try {
    // Skip authentication jika tidak diaktifkan
    if (!config.auth.requireAuth || !config.auth.apiToken) {
      return next();
    }

    // Ambil token dari header Authorization atau query parameter
    let token = null;
    
    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    // Fallback ke query parameter
    if (!token && req.query.token) {
      token = req.query.token;
    }

    // Validasi token
    if (!token) {
      throw new AppError("API token is required", 401);
    }

    if (token !== config.auth.apiToken) {
      throw new AppError("Invalid API token", 403);
    }

    // Token valid, lanjutkan
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware optional authentication (tidak wajib tapi validasi jika ada)
 */
const optionalAuth = (req, res, next) => {
  try {
    if (!config.auth.requireAuth || !config.auth.apiToken) {
      return next();
    }

    // Jika tidak ada token, skip (optional)
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;
    
    if (!authHeader && !queryToken) {
      return next();
    }

    // Jika ada token, validasi
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (queryToken) {
      token = queryToken;
    }

    if (token && token !== config.auth.apiToken) {
      throw new AppError("Invalid API token", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
