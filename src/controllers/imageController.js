const sharp = require("sharp");
const imageService = require("../services/imageService");
const { ApiResponse } = require("../utils/response");
const { AppError, sanitizeString } = require("../utils/errors");
const config = require("../config/config");
const { fetchImageFromUrl } = require("../services/urlFetchService");
const { version } = require("../../package.json");

class ImageController {
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError("No image file provided", 400);
      }

      const { format = "binary" } = req.query;
      const imageBuffer = req.file.buffer;
      const { address, time_created } = req.body;

      // Sanitize inputs untuk prevent XSS/injection
      const sanitizedAddress = address ? sanitizeString(address, 500) : undefined;
      const sanitizedTimeCreated = time_created ? sanitizeString(time_created, 50) : undefined;

      // Process image with watermark (with optional custom timestamp)
      const processedImage = await imageService.addWatermark(
        imageBuffer,
        sanitizedAddress,
        { timeCreated: sanitizedTimeCreated }
      );
      const meta = await sharp(processedImage).metadata();
      const outFormat = meta.format || "jpeg";
      const ext = outFormat === "jpeg" ? "jpg" : outFormat;

      if (format === "json") {
        // Return as JSON with base64
        const base64 = processedImage.toString("base64");
        const response = new ApiResponse(true, "Image processed successfully", {
          image: `data:image/${outFormat};base64,${base64}`,
          size: processedImage.length,
          originalSize: imageBuffer.length,
        });

        return res.json(response);
      } else {
        // Return as binary
        res.set({
          "Content-Type": `image/${outFormat}`,
          "Content-Length": processedImage.length,
          "Content-Disposition": `inline; filename="watermarked-image.${ext}"`,
          "X-Original-Size": imageBuffer.length,
          "X-Processed-Size": processedImage.length,
        });

        return res.send(processedImage);
      }
    } catch (error) {
      next(error);
    }
  }

  async uploadFromUrl(req, res, next) {
    try {
      const { url, format = "binary", address, time_created } = req.body;

      if (!url) {
        throw new AppError("Image URL is required", 400);
      }

      // Sanitize inputs untuk prevent XSS/injection
      const sanitizedAddress = address ? sanitizeString(address, 500) : undefined;
      const sanitizedTimeCreated = time_created ? sanitizeString(time_created, 50) : undefined;

      const fetchedImage = await fetchImageFromUrl(url);
      const imageBuffer = fetchedImage.buffer;

      // Check file size
      if (imageBuffer.length > config.upload.maxFileSizeBytes) {
        throw new AppError(
          `Image too large. Maximum size is ${config.upload.maxFileSize}`,
          400
        );
      }

      // Process image with watermark (with optional address and custom timestamp)
      const processedImage = await imageService.addWatermark(
        imageBuffer,
        sanitizedAddress,
        { timeCreated: sanitizedTimeCreated }
      );
      const meta = await sharp(processedImage).metadata();
      const outFormat = meta.format || "jpeg";
      const ext = outFormat === "jpeg" ? "jpg" : outFormat;

      if (format === "json") {
        // Return as JSON with base64
        const base64 = processedImage.toString("base64");
        const apiResponse = new ApiResponse(
          true,
          "Image processed successfully",
          {
            image: `data:image/${outFormat};base64,${base64}`,
            size: processedImage.length,
            originalSize: imageBuffer.length,
          }
        );

        return res.json(apiResponse);
      } else {
        // Return as binary
        res.set({
          "Content-Type": `image/${outFormat}`,
          "Content-Length": processedImage.length,
          "Content-Disposition": `inline; filename="watermarked-image.${ext}"`,
          "X-Original-Size": imageBuffer.length,
          "X-Processed-Size": processedImage.length,
        });

        return res.send(processedImage);
      }
    } catch (error) {
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        next(
          new AppError("Unable to download image from the provided URL", 400)
        );
        return;
      }

      if (error.code === "ETIMEDOUT") {
        next(new AppError("Request timeout while downloading image", 408));
        return;
      }

      next(error);
    }
  }

  async healthCheck(req, res) {
    const response = new ApiResponse(true, "Service is healthy", {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: require("../../package.json").version,
    });

    res.json(response);
  }

  async getDocumentation(req, res) {
      const docs = {
        title: "Text Over Image API",
        version,
        description: "API untuk menambahkan watermark otomatis pada gambar",
        baseUrl: `${req.protocol}://${req.get("host")}`,
        endpoints: {
          "POST /upload": {
            description: "Upload gambar dari file lokal",
            parameters: {
              image: "File gambar (multipart/form-data)",
            format: "Response format: 'binary' (default) atau 'json'",
          },
          example:
            "curl -X POST -F 'image=@photo.jpg' -F 'format=json' /upload",
        },
          "POST /upload-url": {
            description: "Upload gambar dari URL",
            parameters: {
              url: "URL gambar publik HTTP/HTTPS (private/local diblokir)",
              format: "Response format: 'binary' (default) atau 'json'",
          },
          example: {
            url: "https://example.com/image.jpg",
            format: "json",
          },
        },
          "GET /health": {
            description: "Health check endpoint",
          },
          "GET /api-docs": {
            description: "Swagger UI public untuk dokumentasi OpenAPI",
            authentication: "No authentication required",
          },
        },
        features: [
          "Watermark otomatis dengan tanggal, jam, dan alamat",
          "Support JPG, PNG, WebP",
          "Rate limiting: 100 request per 15 menit",
          "File size limit: 10MB",
          "Tidak menyimpan file di server",
          "Response binary atau JSON base64",
        ],
        watermark: {
          position: "bottom-left",
          format: "Multi-line format with automatic text wrapping",
          structure: [
            "DD/MM/YYYY HH:mm:ss (Date & Time)",
            "[Address] (Auto-wrapped if long)",
          ],
          example: `${new Date().toLocaleDateString(
            "id-ID"
          )} ${new Date().toLocaleTimeString("id-ID")}
${config.watermark.address}`,
        },
      };

    res.json(docs);
  }
}

module.exports = new ImageController();
