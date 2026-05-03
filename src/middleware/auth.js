const { AppError } = require("../utils/errors");
const config = require("../config/config");

/**
 * Middleware untuk API Token Authentication
 * Token dikirim via header: Authorization: Bearer <token>
 */
const authenticateToken = (req, res, next) => {
  try {
    // Skip authentication jika tidak diaktifkan
    if (!config.auth.requireAuth) {
      return next();
    }

    // Ambil token dari header Authorization saja
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
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

module.exports = {
  authenticateToken,
};
