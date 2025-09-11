// services/ImageService.js (CommonJS)
const sharp = require("sharp");
const moment = require("moment-timezone");
const config = require("../config/config");
const { AppError } = require("../utils/errors");

// ===================== Utils: text measure & wrap =====================
function estimateWidthPx(str, fontSize, avgFactor = 0.58) {
  return (str?.length || 0) * fontSize * avgFactor;
}

// Bungkus teks berdasarkan lebar maksimum (prioritas pecah di koma)
function wrapTextByWords(
  text,
  { maxWidthPx, fontSize = 24, avgFactor = 0.58, preferComma = true }
) {
  if (!text) return ["-"];

  const words = text
    .split(preferComma ? /,\s*/ : /\s+/)
    .flatMap((seg, i, arr) => (i < arr.length - 1 ? [seg + ","] : [seg]))
    .join(" ")
    .split(/\s+/);

  const lines = [];
  let line = "";
  for (const w of words) {
    const cand = line ? line + " " + w : w;
    if (estimateWidthPx(cand, fontSize, avgFactor) <= maxWidthPx) {
      line = cand;
    } else {
      if (line) lines.push(line);
      if (estimateWidthPx(w, fontSize, avgFactor) > maxWidthPx) {
        lines.push(w); // kata super panjang dipaksa 1 baris sendiri
        line = "";
      } else {
        line = w;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Batasi jumlah baris & tambahkan "…" bila kepotong
function clampLinesWithEllipsis(
  lines,
  { maxLines, maxWidthPx, fontSize = 24, avgFactor = 0.58 }
) {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] + " " + lines.slice(maxLines).join(" ");
  const ell = "…";
  while (
    estimateWidthPx(last + ell, fontSize, avgFactor) > maxWidthPx &&
    last.includes(" ")
  ) {
    last = last.substring(0, last.lastIndexOf(" "));
  }
  kept[maxLines - 1] = (last || kept[maxLines - 1]) + ell;
  return kept;
}

function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ===================== SVG Builder (advanced, bottom-left) =====================
function buildWatermarkSVGAdvanced({
  width,
  height,
  timestamp, // "DD/MM/YYYY HH:mm:ss"
  address, // string alamat
  status = "Verified",
  align = "left", // 'left' | 'right'
  panelWidthPx, // optional: fixed width; default 70% dari width
  maxAddressLines = 3,
  logoDataUrl = null, // opsional
  logoSizePx = 50, // opsional
  theme = {},
}) {
  // THEME (fallback ke config atau default)
  const PAD = theme.outerPad ?? config?.watermark?.padding ?? 24; // margin panel ke tepi
  const IPAD = theme.innerPad ?? 20; // padding dalam panel
  const GAP = theme.lineGap ?? 28; // jarak antar baris
  const fontStack =
    theme.fontStack ||
    config?.watermark?.fontFamily ||
    "Inter, 'DejaVu Sans', 'Noto Color Emoji', Arial, sans-serif";

  const panelBg = theme.panelBg || "rgba(0,0,0,0.01)"; // semi-transparan
  const stripe = theme.stripeColor || "#FFCC33";
  const timeColor = theme.timeColor || "#0A0A0A";
  const txtWhite = theme.textColor || "#FFFFFF";
  const verifiedGreen = theme.verifiedColor || "#00D084";

  // Panel width & posisi
  const panelW = Math.max(
    260,
    Math.min(panelWidthPx ?? Math.round(width * 0.7), width - PAD * 2)
  );
  const panelX = align === "right" ? width - PAD - panelW : PAD;
  const textMaxW = panelW - IPAD * 2;

  // Typography dinamis (berbasis width)
  const base = Math.max(16, Math.min(48, Math.round(width * 0.025)));
  const timeFont = Math.round(base + 6);
  const dateFont = Math.round(base - 2); // opsional (judul tanggal; bisa dikosongkan)
  const addrFont = Math.round(base - 2);
  const verFont = Math.round(base - 4);

  // Badge waktu (di dalam panel, baris teratas)
  const badgeH = Math.max(56, Math.round(base * 1.45));
  const badgeR = Math.round(base * 0.4);
  const stripeW = Math.max(8, Math.round(base * 0.35));

  // Hitung lebar minimal badge
  const estW = estimateWidthPx(String(timestamp || ""), timeFont, 0.58);
  const innerLeft = stripeW + 40; // stripe + icon + padding
  const innerRight = 40;
  const badgeW = Math.max(
    200,
    Math.min(innerLeft + estW + innerRight, textMaxW)
  );

  // Alamat: wrap + clamp
  let addrLines = wrapTextByWords(
    (address || "Lokasi tidak tersedia").toString(),
    {
      maxWidthPx: textMaxW,
      fontSize: addrFont,
      avgFactor: 0.58,
      preferComma: true,
    }
  );
  addrLines = clampLinesWithEllipsis(addrLines, {
    maxLines: maxAddressLines,
    maxWidthPx: textMaxW,
    fontSize: addrFont,
    avgFactor: 0.58,
  });

  // Verified row & heights
  const logoW = Math.max(16, Number(logoSizePx) || 24);
  const verifyRowH = Math.max(logoW, verFont);
  const verifiedGapTop = 12;

  // Y layout relatif dalam panel
  const yBadgeRel = IPAD;
  const yDateRel = yBadgeRel + badgeH + Math.round(GAP * 0.6);
  const yAddrStartRel = yDateRel + GAP;
  const yVerifiedRel = yAddrStartRel + addrLines.length * GAP + verifiedGapTop;

  // Bottom padding biar tidak mepet
  const BOTTOM_PAD = Math.max(24, Math.ceil(verifyRowH / 2) + 10);

  // Total tinggi panel
  const panelH = yVerifiedRel + verifyRowH + BOTTOM_PAD;

  // Anchor bottom: tempatkan panel pada bagian bawah gambar
  const panelY = Math.max(PAD, height - PAD - panelH);

  // tspans alamat
  const addrTspans = addrLines
    .map((ln, i) => {
      const dy = i === 0 ? 0 : GAP;
      return `<tspan x="${
        panelX + IPAD
      }" dy="${dy}" font-size="${addrFont}" fill="${txtWhite}">${esc(
        ln
      )}</tspan>`;
    })
    .join("");

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>text { font-family: ${fontStack}; }</style>

  <!-- Panel -->
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="18" ry="18" fill="${panelBg}"/>

  <!-- Badge waktu -->
  <g transform="translate(${panelX + IPAD}, ${panelY + yBadgeRel})">
    <rect x="0" y="0" width="${badgeW}" height="${badgeH}" rx="${badgeR}" ry="${badgeR}" fill="#FFFFFF" />
    <rect x="0" y="0" width="${stripeW}" height="${badgeH}" rx="${badgeR}" ry="${badgeR}" fill="${stripe}" />
    <circle cx="${stripeW + 18}" cy="${badgeH / 2}" r="12" fill="${stripe}"/>
    <path d="M ${stripeW + 18} ${
    badgeH / 2 - 7
  } v 7 h 7" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="${stripeW + 40}" y="${badgeH / 2 + Math.round(timeFont * 0.32)}"
          font-size="${timeFont}" font-weight="800" fill="${timeColor}">${esc(
    timestamp || ""
  )}</text>
  </g>

  <!-- (Opsional) judul tanggal: kita kosongkan agar tidak dobel info -->
  <text x="${panelX + IPAD}" y="${
    panelY + yDateRel
  }" font-size="${dateFont}" font-weight="700" fill="${txtWhite}"></text>

  <!-- Alamat (auto wrap) -->
  <text x="${panelX + IPAD}" y="${
    panelY + yAddrStartRel
  }" font-size="${addrFont}" font-weight="500">${addrTspans}</text>

  <!-- VERIFIED + logo -->
  <g transform="translate(${panelX + IPAD}, ${panelY})">
    ${
      logoDataUrl
        ? `
      <circle cx="${logoW / 2 + 1}" cy="${yVerifiedRel + verifyRowH / 2}" r="${
            logoW / 2 + 2
          }" fill="#fff" opacity="0.9"/>
      <image href="${esc(logoDataUrl)}" x="1" y="${
            yVerifiedRel + (verifyRowH - logoW) / 2
          }" width="${logoW}" height="${logoW}" />
      <text x="${logoW + 10}" y="${
            yVerifiedRel + verifyRowH / 2
          }" dominant-baseline="middle"
            font-size="${verFont}" font-weight="700" fill="${txtWhite}">${esc(
            status
          )}</text>
      `
        : `
      <circle cx="12" cy="${
        yVerifiedRel + verifyRowH / 2
      }" r="12" fill="${verifiedGreen}"/>
      <path d="M6,${
        yVerifiedRel + verifyRowH / 2
      } l4,4 l8,-8" stroke="#fff" stroke-width="3" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
      <text x="28" y="${
        yVerifiedRel + verifyRowH / 2
      }" dominant-baseline="middle"
            font-size="${verFont}" font-weight="700" fill="${txtWhite}">${esc(
            status
          )}</text>
      `
    }
  </g>
</svg>`;
}

// ===================== ImageService =====================
class ImageService {
  /**
   * @param {Buffer} imageBuffer
   * @param {string} [addressReq] // alamat override (jika diisi)
   * @param {Object} [opts]
   * @param {string} [opts.align]    // 'left' | 'right'
   * @param {number} [opts.panelWidthPct] // 0.6..0.8 (opsional)
   * @param {number} [opts.maxAddressLines] // default 3
   * @param {string} [opts.logoDataUrl] // data:image/png;base64,...
   * @param {number} [opts.logoSizePx] // default 50
   */
  async addWatermark(imageBuffer, addressReq, opts = {}) {
    try {
      const image = sharp(imageBuffer, { failOn: "none" });
      const metadata = await image.metadata();

      if (!metadata || !metadata.width || !metadata.height) {
        throw new AppError("Invalid image file", 400);
      }

      const { width, height, format } = metadata;
      const supportedFormats = new Set(["jpeg", "jpg", "png", "webp"]);
      const fmt = format === "jpg" ? "jpeg" : format;
      if (!supportedFormats.has(fmt)) {
        throw new AppError("Unsupported image format", 400);
      }

      // Generate timestamp + address
      const timestamp = moment.tz("Asia/Jakarta").format("DD MMM YYYY HH:mm:ss");
      // const addressCfg = config?.watermark?.address || "Lokasi tidak tersedia";
      const address = addressReq || "Lokasi tidak tersedia";

      // Panel width (opsional %)
      const panelWidthPx =
        typeof opts.panelWidthPct === "number"
          ? Math.round(width * Math.min(0.9, Math.max(0.3, opts.panelWidthPct)))
          : Math.round(width * 0.68);

      // Build SVG overlay (ukuran persis image; anchor bottom-left)
      const svg = buildWatermarkSVGAdvanced({
        width,
        height,
        timestamp,
        address,
        status: "Verified",
        align: opts.align === "right" ? "right" : "left",
        panelWidthPx,
        maxAddressLines: Number.isInteger(opts.maxAddressLines)
          ? opts.maxAddressLines
          : 3,
        logoDataUrl: opts.logoDataUrl || null,
        logoSizePx: opts.logoSizePx || 42,
        theme: {
          outerPad: config?.watermark?.padding ?? 24,
          textColor: config?.watermark?.textColor || "#FFFFFF",
          panelBg: config?.watermark?.backgroundColor || "rgba(0,0,0,0.01)",
          fontStack: config?.watermark?.fontFamily || undefined,
        },
      });

      // Composite tanpa mengubah resolusi
      let pipeline = image.composite([
        { input: Buffer.from(svg), top: 0, left: 0 },
      ]);

      // Pertahankan format output sesuai input
      if (fmt === "jpeg")
        pipeline = pipeline.jpeg({
          quality: 95,
          progressive: true,
          mozjpeg: false,
        });
      if (fmt === "png") pipeline = pipeline.png({ compressionLevel: 9 });
      if (fmt === "webp") pipeline = pipeline.webp({ quality: 95 });

      const processedImage = await pipeline.toBuffer();
      return processedImage;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Image processing failed: ${error.message}`, 500);
    }
  }

  // (Opsional) helper jika kamu masih butuh
  generateWatermarkText() {
    const now = moment.tz("Asia/Jakarta");
    const date = now.format("DD/MM/YYYY");
    const time = now.format("HH:mm:ss");
    const address = config?.watermark?.address || "Lokasi tidak tersedia";
    // Tidak dipakai di versi advanced (kita pakai multi-line)
    return `${date} ${time} ${address} Verified`;
    // Biarkan tetap ada jika kamu ingin fallback.
  }

  calculateFontSize(imageWidth) {
    // Tidak lagi dipakai langsung; ukuran dinamis di builder
    const baseFontSize = config?.watermark?.baseFontSize ?? 24; // untuk compat
    const baseWidth = 1920;
    let fontSize = (imageWidth / baseWidth) * baseFontSize;
    fontSize = Math.max(12, Math.min(fontSize, 48));
    return Math.floor(fontSize);
  }

  createWatermarkSvg() {
    // Tidak digunakan lagi; digantikan buildWatermarkSVGAdvanced
    return "";
  }

  async validateImageBuffer(buffer) {
    try {
      const metadata = await sharp(buffer, { failOn: "none" }).metadata();

      if (!metadata || !metadata.width || !metadata.height) {
        throw new Error("Invalid image file");
      }

      const supportedFormats = ["jpeg", "jpg", "png", "webp"];
      if (!supportedFormats.includes(metadata.format)) {
        throw new Error("Unsupported image format");
      }

      return metadata;
    } catch (error) {
      throw new Error(`Image validation failed: ${error.message}`);
    }
  }
}

module.exports = new ImageService();
