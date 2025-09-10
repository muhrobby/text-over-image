class ApiResponse {
  constructor(success, message, data = null, meta = null) {
    this.success = success;
    this.message = message;
    this.timestamp = new Date().toISOString();

    if (data !== null) {
      this.data = data;
    }

    if (meta !== null) {
      this.meta = meta;
    }
  }

  static success(message, data = null, meta = null) {
    return new ApiResponse(true, message, data, meta);
  }

  static error(message, meta = null) {
    return new ApiResponse(false, message, null, meta);
  }
}

module.exports = {
  ApiResponse,
};
