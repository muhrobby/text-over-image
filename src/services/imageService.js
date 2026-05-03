// services/ImageService.js (CommonJS)
const sharp = require("sharp");
const moment = require("moment-timezone");
const fs = require("fs").promises;
const path = require("path");
const config = require("../config/config");
const { AppError } = require("../utils/errors");

// ===================== THEME CONFIGURATION =====================
const DEFAULT_THEME = {
  // Spacing & Layout
  outerPad: 32,           // Margin ke tepi gambar
  innerPad: 16,           // Padding internal
  lineGap: 8,             // Jarak antar baris teks (lebih rapat)
  
  // Colors - Professional & Clean
  timeColor: "#FFFFFF",   // Warna teks waktu
  textColor: "#FFFFFF",   // Warna teks alamat
  strokeColor: "#000000", // Warna outline untuk visibility
  
  // Typography - Professional
  fontStack: "Inter, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
  fontWeightTime: "600",      // Semi-bold untuk waktu
  fontWeightAddress: "500",   // Medium untuk alamat
  
  // Logo
  logoSize: 180,              // Logo lebih besar (15% width base)
  logoOpacity: 0.95,          // Slightly transparent
  
  // Text Sizes (akan dikalkulasi responsive)
  baseTimeFontSize: 40,       // Base untuk timestamp (sama dengan address)
  baseAddressFontSize: 40,    // Base untuk alamat (ukuran sama)
};

// ===================== TEXT UTILITIES =====================
/**
 * Estimasi lebar teks dalam pixel
 */
function estimateWidthPx(str, fontSize, avgFactor = 0.58) {
  return (str?.length || 0) * fontSize * avgFactor;
}

/**
 * Membungkus teks panjang menjadi multiple lines
 * dengan prioritas pemisahan di koma
 */
function wrapTextByWords(
  text,
  { maxWidthPx, fontSize = 24, avgFactor = 0.58, preferComma = true }
) {
  if (!text) return ["-"];

  // Split by comma first if preferred, then by spaces
  const words = text
    .split(preferComma ? /,\s*/ : /\s+/)
    .flatMap((seg, i, arr) => (i < arr.length - 1 ? [seg + ","] : [seg]))
    .join(" ")
    .split(/\s+/);

  const lines = [];
  let line = "";
  
  for (const w of words) {
    const candidate = line ? line + " " + w : w;
    if (estimateWidthPx(candidate, fontSize, avgFactor) <= maxWidthPx) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      if (estimateWidthPx(w, fontSize, avgFactor) > maxWidthPx) {
        lines.push(w); // Kata terlalu panjang, paksa 1 baris sendiri
        line = "";
      } else {
        line = w;
      }
    }
  }
  
  if (line) lines.push(line);
  return lines;
}

/**
 * Batasi jumlah baris & tambahkan ellipsis bila kepotong
 */
function clampLinesWithEllipsis(
  lines,
  { maxLines, maxWidthPx, fontSize = 24, avgFactor = 0.58 }
) {
  if (lines.length <= maxLines) return lines;
  
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] + " " + lines.slice(maxLines).join(" ");
  const ellipsis = "…";
  
  // Trim kata sampai muat dengan ellipsis
  while (
    estimateWidthPx(last + ellipsis, fontSize, avgFactor) > maxWidthPx &&
    last.includes(" ")
  ) {
    last = last.substring(0, last.lastIndexOf(" "));
  }
  
  kept[maxLines - 1] = (last || kept[maxLines - 1]) + ellipsis;
  return kept;
}

/**
 * Escape special XML/SVG characters
 */
function escapeXml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ===================== FONT LOADING UTILITIES =====================
const fontCache = {};

function getMimeType(ext) {
  const types = {
    ttf: "font/truetype",
    otf: "font/opentype",
    woff: "font/woff",
    woff2: "font/woff2",
  };
  return types[ext.toLowerCase()] || "application/octet-stream";
}

async function loadFontDataUrl(fontPath) {
  if (!fontPath) return null;

  if (fontCache[fontPath]) {
    return fontCache[fontPath];
  }

  try {
    const fullPath = path.resolve(fontPath);
    const buffer = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).substring(1);
    const mimeType = getMimeType(ext);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    fontCache[fontPath] = dataUrl;
    return dataUrl;
  } catch (err) {
    console.warn(`Failed to load font from ${fontPath}:`, err.message);
    return null;
  }
}

async function resolveFontFilePath(fontPath) {
  if (!fontPath) return null;

  const fullPath = path.resolve(fontPath);
  try {
    await fs.access(fullPath);
    return fullPath;
  } catch (err) {
    console.warn(`Failed to access font from ${fontPath}:`, err.message);
    return null;
  }
}

function buildFontFaceCSS(fontFamily, fontDataUrl, fontWeight = "normal", fontStyle = "normal") {
  if (!fontDataUrl) return "";
  return `
    @font-face {
      font-family: '${fontFamily}';
      src: url('${fontDataUrl}');
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
    }`;
}

// ===================== DYNAMIC TYPOGRAPHY CALCULATOR =====================
/**
 * Calculate responsive font sizes based on image width
 * Scaling penuh tanpa batasan minimum
 * Base 1200px untuk foto smartphone (3000-4000px width = 2.5-3.3x scaling)
 */
function calculateFontSizes(imageWidth) {
  const scaleFactor = imageWidth / 1200; // Base diperkecil agar scaling lebih besar
  
  // Semua font menggunakan baseAddressFontSize (40px) untuk konsistensi
  const fontSize = Math.round(DEFAULT_THEME.baseAddressFontSize * scaleFactor);
  
  return {
    time: fontSize,        // Sama dengan address
    address: fontSize,     // Base 40px
    base: fontSize         // Semua sama untuk konsistensi
  };
}

/**
 * Calculate logo size based on image dimensions
 */
function calculateLogoSize(imageWidth, imageHeight) {
  // Logo size responsive: 15% dari lebar gambar, range 150-500px
  const logoSize = Math.max(150, Math.min(500, Math.round(imageWidth * 0.15)));
  return logoSize;
}

// ===================== SVG COMPONENT BUILDERS =====================
/**
 * Build professional timestamp text (simple & clean)
 */
function buildTimestamp({ x, y, timestamp, fontSize, theme }) {
  // Format yang lebih profesional: DD MMM YYYY | HH:mm:ss
  const parts = timestamp.split(' ');
  const datePart = parts.slice(0, 3).join(' '); // DD MMM YYYY
  const timePart = parts.slice(3).join(' ');     // HH:mm:ss
  const fullText = `${datePart} | ${timePart}`;
  
  return `
  <!-- Timestamp dengan outline untuk visibility -->
  <text x="${x}" y="${y}" text-anchor="end"
        font-size="${fontSize}" 
        font-weight="${theme.fontWeightTime}" 
        stroke="${theme.strokeColor}" stroke-width="4" stroke-linejoin="round"
        fill="none">
    ${escapeXml(fullText)}
  </text>
  <text x="${x}" y="${y}" text-anchor="end"
        font-size="${fontSize}" 
        font-weight="${theme.fontWeightTime}" 
        fill="${theme.timeColor}">
    ${escapeXml(fullText)}
  </text>`;
}

/**
 * Build address text with outline (right-aligned, bottom-right position)
 */
function buildAddressText({ x, y, lines, fontSize, lineGap, theme }) {
  return lines.map((line, i) => {
    const lineY = y + (i * lineGap);
    return `
    <!-- Address line ${i + 1} with stroke -->
    <text x="${x}" y="${lineY}" text-anchor="end"
          font-size="${fontSize}" 
          font-weight="${theme.fontWeightAddress}"
          stroke="${theme.strokeColor}" stroke-width="4" stroke-linejoin="round"
          fill="none">
      ${escapeXml(line)}
    </text>
    <text x="${x}" y="${lineY}" text-anchor="end"
          font-size="${fontSize}" 
          font-weight="${theme.fontWeightAddress}"
          fill="${theme.textColor}">
      ${escapeXml(line)}
    </text>`;
  }).join('');
}

/**
 * Build logo in top-right corner
 */
function buildLogoTopRight({ x, y, size, logoDataUrl, opacity }) {
  if (!logoDataUrl) return '';
  
  return `
  <!-- Brand Logo - Top Right -->
  <image href="${escapeXml(logoDataUrl)}" 
         x="${x}" y="${y}" 
         width="${size}" height="${size}" 
         opacity="${opacity}" 
         preserveAspectRatio="xMidYMid meet"/>`;
}

// ===================== MAIN SVG BUILDER =====================
/**
 * Build complete watermark SVG overlay - PROFESSIONAL LAYOUT
 * - Logo: Top-right corner (besar, transparan)
 * - Timestamp & Address: Bottom-right corner (right-aligned)
 * - NO verified badge
 */
function buildWatermarkSVG({
  width,
  height,
  timestamp,
  address,
  maxAddressLines = 5,
  logoDataUrl = null,
  theme = {},
  fontFaceCSS = "",
  fontFamilyName = null,
  renderText = true,
}) {
  // Merge theme dengan default
  const finalTheme = { ...DEFAULT_THEME, ...theme };
  
  const {
    outerPad,
    lineGap,
    fontStack,
    logoOpacity
  } = finalTheme;

  // Calculate responsive font sizes
  const fonts = calculateFontSizes(width);
  
  // Calculate logo size (responsive & proportional)
  const logoSize = calculateLogoSize(width, height);

  // Logo position - Top Right
  const logoX = width - outerPad - logoSize;
  const logoY = outerPad;

  // Process address text (wrap & clamp)
  const maxWidth = width * 0.70; // Max 70% dari lebar gambar untuk address agar tidak terpotong
  let addressLines = wrapTextByWords(
    (address || "Lokasi tidak tersedia").toString(),
    {
      maxWidthPx: maxWidth,
      fontSize: fonts.address,
      avgFactor: 0.58,
      preferComma: true,
    }
  );
  
  addressLines = clampLinesWithEllipsis(addressLines, {
    maxLines: maxAddressLines,
    maxWidthPx: maxWidth,
    fontSize: fonts.address,
    avgFactor: 0.58,
  });

  // Calculate positions - Bottom Right
  const bottomMargin = outerPad;
  const rightX = width - outerPad;
  
  // Calculate line height for address
  const addressLineHeight = fonts.address + lineGap;
  const totalAddressHeight = addressLines.length * addressLineHeight;
  
  // Positions (from bottom to top)
  const addressStartY = height - bottomMargin;
  const timestampY = addressStartY - totalAddressHeight - (lineGap * 2);

  // Build components
  const logoSVG = buildLogoTopRight({
    x: logoX,
    y: logoY,
    size: logoSize,
    logoDataUrl,
    opacity: logoOpacity
  });

  const timestampSVG = renderText
    ? buildTimestamp({
        x: rightX,
        y: timestampY,
        timestamp,
        fontSize: fonts.time,
        theme: finalTheme
      })
    : "";

  const addressSVG = renderText
    ? buildAddressText({
        x: rightX,
        y: addressStartY - totalAddressHeight + addressLineHeight,
        lines: addressLines,
        fontSize: fonts.address,
        lineGap: addressLineHeight,
        theme: finalTheme
      })
    : "";

  // Compose final SVG
  const effectiveFontStack = fontFamilyName || fontStack;
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      ${fontFaceCSS}
      text {
        font-family: ${effectiveFontStack};
        user-select: none;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
    </style>
  </defs>

  <!-- Brand Logo - Top Right Corner -->
  ${logoSVG}

  <!-- Professional Timestamp - Bottom Right -->
  ${timestampSVG}

  <!-- Address Text - Bottom Right -->
  ${addressSVG}
</svg>`;
}

function buildSharpTextOverlays({
  width,
  height,
  timestamp,
  address,
  maxAddressLines = 5,
  theme = {},
  regularFontFile,
  semiboldFontFile,
}) {
  const finalTheme = { ...DEFAULT_THEME, ...theme };
  const { outerPad, lineGap } = finalTheme;
  const fonts = calculateFontSizes(width);
  const maxWidth = width * 0.70;
  const textWidth = Math.round(maxWidth);
  const rightX = width - outerPad;
  const left = Math.max(0, Math.round(rightX - maxWidth));

  let addressLines = wrapTextByWords(
    (address || "Lokasi tidak tersedia").toString(),
    {
      maxWidthPx: maxWidth,
      fontSize: fonts.address,
      avgFactor: 0.58,
      preferComma: true,
    }
  );

  addressLines = clampLinesWithEllipsis(addressLines, {
    maxLines: maxAddressLines,
    maxWidthPx: maxWidth,
    fontSize: fonts.address,
    avgFactor: 0.58,
  });

  const addressLineHeight = fonts.address + lineGap;
  const totalAddressHeight = addressLines.length * addressLineHeight;
  const addressStartY = height - outerPad;
  const timestampY = addressStartY - totalAddressHeight - (lineGap * 2);
  const timestampParts = timestamp.split(" ");
  const timestampText = `${timestampParts.slice(0, 3).join(" ")} | ${timestampParts.slice(3).join(" ")}`;
  const overlays = [];

  const makeTextOverlay = ({ text, top, fontSize, fontfile }) => ({
    input: {
      text: {
        text: escapeXml(text),
        font: `Inter ${fontSize}`,
        fontfile,
        width: textWidth,
        align: "right",
        rgba: true,
      },
    },
    left,
    top: Math.max(0, Math.round(top)),
  });

  overlays.push(
    makeTextOverlay({
      text: timestampText,
      top: timestampY - fonts.time,
      fontSize: fonts.time,
      fontfile: semiboldFontFile || regularFontFile,
    })
  );

  addressLines.forEach((line, index) => {
    const lineY = addressStartY - totalAddressHeight + addressLineHeight + (index * addressLineHeight);
    overlays.push(
      makeTextOverlay({
        text: line,
        top: lineY - fonts.address,
        fontSize: fonts.address,
        fontfile: regularFontFile || semiboldFontFile,
      })
    );
  });

  return overlays;
}

// ===================== IMAGE SERVICE CLASS =====================
class ImageService {
  /**
   * Load logo from public folder and convert to data URL
   * @returns {Promise<string|null>} Logo data URL or null if not found
   */
  async loadLogoDataUrl() {
    try {
      // Cari logo di folder public dengan berbagai ekstensi
      const publicDir = path.join(__dirname, "../../public");
      const logoFiles = ["logo.png", "logo.jpg", "logo.jpeg", "logo.webp", "logo.svg"];
      
      for (const logoFile of logoFiles) {
        const logoPath = path.join(publicDir, logoFile);
        try {
          const logoBuffer = await fs.readFile(logoPath);
          const ext = path.extname(logoFile).substring(1);
          const mimeType = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
          const base64 = logoBuffer.toString("base64");
          return `data:${mimeType};base64,${base64}`;
        } catch (err) {
          // File tidak ditemukan, coba yang lain
          continue;
        }
      }
      
      return null; // Tidak ada logo ditemukan
    } catch (error) {
      console.warn("Failed to load logo:", error.message);
      return null;
    }
  }

  /**
   * Add watermark to image with customizable options
   * NEW DESIGN: Logo top-right, timestamp & address bottom-right
   * 
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {string} [addressReq] - Address override (optional)
   * @param {Object} [opts] - Customization options
   * @param {string} [opts.timeCreated] - Custom timestamp (ISO 8601 format, optional)
   * @param {string} [opts.logoDataUrl] - Custom logo data URL (optional)
   * @param {Object} [opts.theme] - Theme overrides (optional)
   * @param {number} [opts.maxAddressLines] - Max lines for address (optional)
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async addWatermark(imageBuffer, addressReq, opts = {}) {
    try {
      // Load and validate image
      const image = sharp(imageBuffer, { failOn: "none" });
      const metadata = await image.metadata();

      if (!metadata || !metadata.width || !metadata.height) {
        throw new AppError("Invalid image file", 400);
      }

      const { width, height, format } = metadata;

      const pixelCount = width * height;
      if (pixelCount > config.upload.maxImagePixels) {
        throw new AppError(
          `Image dimensions too large. Maximum allowed is ${Math.round(config.upload.maxImagePixels / 1000000)} megapixels (${width}x${height} = ${Math.round(pixelCount / 1000000)}MP)`,
          400
        );
      }

      // Validate format
      const supportedFormats = new Set(["jpeg", "jpg", "png", "webp"]);
      const normalizedFormat = format === "jpg" ? "jpeg" : format;
      
      if (!supportedFormats.has(normalizedFormat)) {
        throw new AppError("Unsupported image format", 400);
      }

      // Generate or use custom timestamp
      let timestamp;
      if (opts.timeCreated) {
        // Sanitize: Only accept string input
        if (typeof opts.timeCreated !== 'string') {
          throw new AppError("Invalid time_created type. Must be a string", 400);
        }
        
        // Parse custom timestamp with multiple formats support
        try {
          let customMoment;
          
          // Try parsing with multiple formats
          const formats = [
            moment.ISO_8601,                    // ISO 8601: 2026-01-21T12:27:30+07:00
            'YYYY-MM-DD HH:mm:ss',              // SQL/MySQL: 2026-01-21 12:27:30
            'YYYY-MM-DDTHH:mm:ss',              // ISO without timezone: 2026-01-21T12:27:30
            'DD/MM/YYYY HH:mm:ss',              // Indonesian: 21/01/2026 12:27:30
            'DD-MM-YYYY HH:mm:ss',              // Alternative: 21-01-2026 12:27:30
          ];
          
          // Try each format
          for (const format of formats) {
            customMoment = moment.tz(opts.timeCreated, format, "Asia/Jakarta");
            if (customMoment.isValid()) {
              break;
            }
          }
          
          // If still invalid, throw error
          if (!customMoment || !customMoment.isValid()) {
            throw new Error("Invalid date format");
          }
          
          // Security: Validate year range to prevent unrealistic dates
          const year = customMoment.year();
          if (year < 1900 || year > 2100) {
            throw new Error("Year must be between 1900 and 2100");
          }
          
          timestamp = customMoment.format("DD MMM YYYY HH:mm:ss");
        } catch (err) {
          throw new AppError(
            `Invalid time_created format: "${opts.timeCreated}". Supported formats: ` +
            `ISO 8601 (2026-01-21T12:27:30+07:00), SQL (2026-01-21 12:27:30), ` +
            `Indonesian (21/01/2026 12:27:30)`,
            400
          );
        }
      } else {
        // Default: current time in Asia/Jakarta timezone
        timestamp = moment
          .tz("Asia/Jakarta")
          .format("DD MMM YYYY HH:mm:ss");
      }

      // Use provided address or fallback
      // Security: Sanitize address to prevent XSS (already escaped in escapeXml but double-check)
      let address = addressReq || "Lokasi tidak tersedia";
      
      // Remove potential script tags and dangerous characters
      if (typeof address === 'string') {
        address = address.trim();
        // Max length already validated in middleware (500 chars)
        // Additional sanitization: remove null bytes and control characters
        address = address.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      } else {
        address = "Lokasi tidak tersedia";
      }

      // Load logo dari public folder jika tidak disediakan
      let logoDataUrl = opts.logoDataUrl;
      if (!logoDataUrl) {
        logoDataUrl = await this.loadLogoDataUrl();
      }

      // Load embedded fonts if configured (for Vercel/cloud deployments)
      let fontFaceCSS = "";
      let fontFamilyName = null;
      let regularFontFile = null;
      let semiboldFontFile = null;
      const cfgRegular = config.watermark.fontRegular;
      const cfgSemibold = config.watermark.fontSemibold;

      if (cfgRegular || cfgSemibold) {
        regularFontFile = await resolveFontFilePath(cfgRegular);
        semiboldFontFile = await resolveFontFilePath(cfgSemibold);

        const regularData = await loadFontDataUrl(cfgRegular);
        const semiboldData = await loadFontDataUrl(cfgSemibold);

        if (regularData || semiboldData) {
          fontFamilyName = "WatermarkFont";
          fontFaceCSS =
            buildFontFaceCSS("WatermarkFont", regularData, "normal", "normal") +
            buildFontFaceCSS("WatermarkFont", semiboldData, "600", "normal");
        }
      }

      // Merge theme with config defaults
      const themeOverrides = {
        ...opts.theme,
      };

      // Build SVG watermark overlay - NEW PROFESSIONAL DESIGN
      const svg = buildWatermarkSVG({
        width,
        height,
        timestamp,
        address,
        maxAddressLines: Number.isInteger(opts.maxAddressLines)
          ? opts.maxAddressLines
          : 5,
        logoDataUrl: logoDataUrl,
        theme: themeOverrides,
        fontFaceCSS,
        fontFamilyName,
        renderText: !(regularFontFile || semiboldFontFile),
      });

      const textOverlays = regularFontFile || semiboldFontFile
        ? buildSharpTextOverlays({
            width,
            height,
            timestamp,
            address,
            maxAddressLines: Number.isInteger(opts.maxAddressLines)
              ? opts.maxAddressLines
              : 5,
            theme: themeOverrides,
            regularFontFile,
            semiboldFontFile,
          })
        : [];

      // Composite watermark onto image
      let pipeline = image.composite([
        { input: Buffer.from(svg), top: 0, left: 0 },
        ...textOverlays,
      ]);

      // Preserve output format with high quality
      if (normalizedFormat === "jpeg") {
        pipeline = pipeline.jpeg({
          quality: 95,
          progressive: true,
          mozjpeg: false,
        });
      } else if (normalizedFormat === "png") {
        pipeline = pipeline.png({ 
          compressionLevel: 9,
          quality: 95
        });
      } else if (normalizedFormat === "webp") {
        pipeline = pipeline.webp({ 
          quality: 95,
          lossless: false
        });
      }

      const processedImage = await pipeline.toBuffer();
      return processedImage;
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Image processing failed: ${error.message}`, 500);
    }
  }

}

module.exports = new ImageService();
