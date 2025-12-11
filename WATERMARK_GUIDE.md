# 🎨 Watermark/Stamp Customization Guide

## Overview

Watermark API sudah di-refactor dengan arsitektur yang lebih modular dan mudah dikustomisasi. Setiap komponen stamp dibangun secara terpisah dan dapat disesuaikan dengan kebutuhan.

## 📐 Struktur Stamp

Stamp terdiri dari 3 komponen utama:

```
┌─────────────────────────────────────┐
│  📅 Time Badge                      │  ← Timestamp dengan icon jam
│                                     │
│  📍 Address Text (Multi-line)       │  ← Alamat (auto-wrap)
│                                     │
│  ✓ Verified Badge                   │  ← Status verified
└─────────────────────────────────────┘
```

## 🎨 Theme Configuration

### Default Theme

```javascript
const DEFAULT_THEME = {
  // Spacing & Layout
  outerPad: 24,           // Margin panel ke tepi gambar
  innerPad: 20,           // Padding dalam panel
  lineGap: 28,            // Jarak antar baris teks
  bottomPad: 24,          // Padding bawah panel
  
  // Colors
  panelBg: "rgba(0, 0, 0, 0.65)",     // Background panel (semi-transparent)
  stripeColor: "#FFCC33",              // Warna stripe kuning
  timeColor: "#0A0A0A",                // Warna teks waktu (hitam)
  textColor: "#FFFFFF",                // Warna teks putih
  verifiedColor: "#00D084",            // Warna hijau verified
  badgeBg: "#FFFFFF",                  // Background badge putih
  
  // Typography
  fontStack: "Inter, 'Segoe UI', 'DejaVu Sans', Arial, sans-serif",
  fontWeightTime: "800",               // Extra bold untuk waktu
  fontWeightAddress: "500",            // Medium untuk alamat
  fontWeightVerified: "700",           // Bold untuk verified
  
  // Border Radius
  panelRadius: 18,                     // Panel corner radius
  badgeRadius: 12,                     // Badge corner radius
  
  // Sizes
  stripeWidth: 8,                      // Lebar stripe kuning
  clockIconSize: 12,                   // Ukuran icon jam
  verifiedIconSize: 12,                // Ukuran icon verified
  logoSize: 42,                        // Ukuran logo custom
};
```

## 📝 Penggunaan

### Basic Usage

```javascript
// Upload dengan alamat custom
const response = await fetch('/upload', {
  method: 'POST',
  body: formData
});
```

### Custom Address

```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('address', 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta');

const response = await fetch('/upload', {
  method: 'POST',
  body: formData
});
```

### Alignment (Left/Right)

Saat ini alignment dikontrol melalui parameter `opts.align` di kode:

```javascript
// Di controller, bisa ditambahkan:
const { align = 'left' } = req.body;

const processedImage = await imageService.addWatermark(
  imageBuffer,
  address,
  { align } // 'left' atau 'right'
);
```

## 🎯 Component Breakdown

### 1. Time Badge Component

```javascript
buildTimeBadge({
  x, y,                    // Position
  width, height,           // Dimensions
  radius,                  // Border radius
  stripeWidth,            // Yellow stripe width
  timestamp,              // Text to display
  fontSize,               // Font size
  theme                   // Theme object
})
```

**Features:**
- White background dengan yellow stripe
- Clock icon dengan animasi subtle
- Responsive font sizing
- Auto-width berdasarkan timestamp

### 2. Address Text Component

```javascript
buildAddressText({
  x, y,                   // Position
  lines,                  // Array of text lines
  fontSize,              // Font size
  theme                  // Theme object
})
```

**Features:**
- Auto text wrapping (preferensi split di koma)
- Multi-line support (default 3 baris max)
- Ellipsis (...) untuk teks yang terlalu panjang
- Dynamic line spacing

### 3. Verified Badge Component

```javascript
buildVerifiedBadge({
  x, y,                   // Position
  status,                 // Text (e.g., "Verified")
  fontSize,              // Font size
  logoDataUrl,           // Optional custom logo
  logoSize,              // Logo size
  theme                  // Theme object
})
```

**Features:**
- Default: Green checkmark dengan "Verified" text
- Optional: Custom logo support
- Responsive sizing
- Professional styling

## 🔧 Customization Examples

### 1. Dark Theme

Ubah di `src/config/config.js`:

```javascript
watermark: {
  backgroundColor: "rgba(0, 0, 0, 0.85)", // Lebih gelap
  textColor: "#FFFFFF",
  stripeColor: "#FFD700", // Gold
  verifiedColor: "#4ADE80", // Lighter green
}
```

### 2. Light Theme

```javascript
watermark: {
  backgroundColor: "rgba(255, 255, 255, 0.90)", // Putih semi-transparent
  textColor: "#0A0A0A", // Hitam
  stripeColor: "#3B82F6", // Blue
  verifiedColor: "#10B981", // Green
}
```

### 3. Brand Colors

```javascript
watermark: {
  backgroundColor: "rgba(17, 24, 39, 0.80)", // Dark slate
  textColor: "#F9FAFB",
  stripeColor: "#F59E0B", // Amber
  verifiedColor: "#10B981", // Emerald
}
```

## 🚀 Advanced Features

### Responsive Typography

Font sizes dihitung otomatis berdasarkan lebar gambar:

```javascript
const base = Math.max(16, Math.min(48, width * 0.025));

fonts = {
  time: base + 6,      // Paling besar
  address: base - 2,   // Medium
  verified: base - 4,  // Paling kecil
}
```

### Auto Text Wrapping

Algoritma wrapping cerdas:
1. **Preferensi split di koma** untuk alamat yang lebih natural
2. **Word-aware wrapping** tidak memotong kata
3. **Ellipsis handling** untuk teks yang terlalu panjang
4. **Width calculation** akurat dengan faktor 0.58

### Panel Width Options

```javascript
// Via percentage (30% - 90%)
{ panelWidthPct: 0.7 }  // 70% dari lebar gambar

// Default: 68% dari lebar gambar
// Min: 260px
// Max: gambar width - (2 × padding)
```

## 📊 Performance

- **No resolution changes** - gambar tetap pada resolusi asli
- **SVG overlay** - lightweight dan crisp di semua ukuran
- **Quality preservation** - JPEG 95%, PNG compression 9
- **Fast processing** - single composite operation

## 🎨 Design Principles

1. **Modular Components** - Setiap bagian stamp bisa diubah independently
2. **Responsive Design** - Auto-adjust berdasarkan ukuran gambar
3. **Professional Look** - Clean, modern, dan easy to read
4. **Accessibility** - High contrast untuk readability
5. **Customizable** - Banyak options untuk branding

## 🔍 Tips & Best Practices

### 1. Choosing Background Opacity

- **0.5-0.7**: Untuk gambar dengan background yang complex
- **0.7-0.85**: Untuk readability maksimal
- **0.3-0.5**: Untuk subtle watermark

### 2. Font Selection

Gunakan font stack dengan fallbacks:
```
'Primary Font', 'Fallback 1', 'Fallback 2', sans-serif
```

### 3. Address Length

Optimal: 2-3 lines
- Line 1: Jalan & nomor
- Line 2: Kelurahan & kecamatan
- Line 3: Kota & provinsi

### 4. Color Contrast

Pastikan:
- Text color vs panel background: minimal 4.5:1 ratio
- Badge elements visible pada semua jenis gambar

## 🐛 Troubleshooting

### Teks Terpotong

Solusi:
1. Increase `panelWidthPct`
2. Decrease `maxAddressLines`
3. Shorten address text

### Panel Terlalu Besar

Solusi:
1. Decrease `innerPad` dan `outerPad`
2. Decrease `lineGap`
3. Use shorter address

### Readability Issues

Solusi:
1. Increase `backgroundColor` opacity
2. Adjust `textColor` for better contrast
3. Use bold font weights

## 📚 API Reference

See `src/services/imageService.js` for full implementation details.

### Main Method

```javascript
imageService.addWatermark(imageBuffer, address, options)
```

**Parameters:**
- `imageBuffer` (Buffer): Input image
- `address` (string): Address text (optional)
- `options` (Object): Customization options
  - `align` ('left'|'right'): Panel alignment
  - `panelWidthPct` (number): Panel width 0.3-0.9
  - `maxAddressLines` (number): Max address lines
  - `logoDataUrl` (string): Custom logo data URL
  - `logoSizePx` (number): Logo size in pixels
  - `theme` (Object): Theme overrides

**Returns:** Promise<Buffer> - Processed image

---

Made with ❤️ for professional watermarking
