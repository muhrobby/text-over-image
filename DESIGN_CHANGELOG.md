# Changelog - Timestamp Design Update

## Version 2.0.0 - December 11, 2025

### 🎨 Major Design Changes

#### 1. Timestamp Design Refactor
- **Removed background panel** untuk timestamp, address, dan verified badge
- **Added text outline/stroke** dengan warna hitam untuk meningkatkan visibility di berbagai background
- Text sekarang memiliki **stroke outline 4px** untuk alamat dan 3px untuk verified text
- Time badge tetap memiliki background putih untuk visibility optimal

#### 2. Address Text Wrapping
- **Automatic line wrapping** untuk alamat yang panjang
- Maksimum **5 baris** untuk alamat (sebelumnya 3 baris)
- Prioritas pemisahan di **koma** untuk pembacaan yang lebih baik
- Otomatis menambahkan **ellipsis (…)** jika alamat terlalu panjang

#### 3. Brand Logo Support
- Mendukung **custom logo** dari folder `public/`
- Mencari file logo dengan format: `logo.png`, `logo.jpg`, `logo.jpeg`, `logo.webp`, `logo.svg`
- Logo ditampilkan di sebelah badge "Verified"
- Logo memiliki **white background circle** untuk visibility

#### 4. API Token Authentication
- **Optional authentication** menggunakan API Token
- Token dapat dikirim via **Authorization header** atau **query parameter**
- Konfigurasi melalui environment variables: `REQUIRE_AUTH` dan `API_TOKEN`
- Dokumentasi lengkap di [AUTH_GUIDE.md](./AUTH_GUIDE.md)

### 🔧 Technical Changes

#### Files Modified:
- `src/middleware/validation.js` - Fixed duplicate schema validation
- `src/services/imageService.js` - Refactored SVG generation without background
- `src/config/config.js` - Added auth configuration
- `src/routes/index.js` - Added authentication middleware
- `.env.example` - Added auth variables

#### Files Added:
- `src/middleware/auth.js` - API token authentication middleware
- `public/logo.svg` - Placeholder brand logo
- `AUTH_GUIDE.md` - Authentication documentation

### 🐛 Bug Fixes

1. **Fixed validation error** pada endpoint `/upload-url`
   - Error: `"format" is not allowed`
   - Cause: Duplicate schema definition di validation.js
   - Solution: Merged duplicate schemas

### 📖 API Changes

#### Request Headers (New):
```
Authorization: Bearer <your-api-token>
```

#### Query Parameters (New):
```
?token=<your-api-token>
```

### 🎯 Visual Improvements

**Before:**
- Background panel dengan opacity untuk semua text
- Alamat terpotong di 3 baris
- Tidak ada logo brand

**After:**
- Text dengan outline/stroke, no background panel
- Alamat dapat wrap sampai 5 baris
- Logo brand otomatis dimuat dari folder public
- Lebih readable di berbagai background image

### 📋 Examples

#### Text with Outline:
```svg
<!-- Stroke for visibility -->
<text stroke="#000" stroke-width="4" fill="none">
  Address text
</text>
<!-- Fill for color -->
<text fill="#FFFFFF">
  Address text
</text>
```

#### Long Address Handling:
```
Input: "Jl. Jenderal Sudirman No. 123, RT.001/RW.002, Kelurahan Karet Tengsin, Kecamatan Tanah Abang, Jakarta Pusat, DKI Jakarta 10250"

Output (5 lines):
Line 1: Jl. Jenderal Sudirman No. 123,
Line 2: RT.001/RW.002,
Line 3: Kelurahan Karet Tengsin,
Line 4: Kecamatan Tanah Abang,
Line 5: Jakarta Pusat, DKI Jakarta…
```

### 🔐 Security Improvements

- API Token authentication untuk mencegah abuse
- Token validation via middleware
- Optional authentication mode untuk development

### 📚 Documentation

New documentation files:
- [AUTH_GUIDE.md](./AUTH_GUIDE.md) - Panduan lengkap API authentication

### 🚀 Migration Guide

#### For Existing Users:

1. **Update .env file:**
```env
# Add these lines to your .env
REQUIRE_AUTH=false  # Set to true to enable auth
API_TOKEN=your-secret-token-here
```

2. **Add logo (optional):**
```bash
# Copy your logo to public folder
cp your-logo.png public/logo.png
```

3. **Restart server:**
```bash
npm run dev
```

#### For New Users:

1. **Copy .env.example:**
```bash
cp .env.example .env
```

2. **Edit .env if needed**

3. **Run server:**
```bash
npm install
npm run dev
```

### ⚠️ Breaking Changes

**None** - All changes are backward compatible. Existing API calls will continue to work without modification.

### 🎁 What's Next?

Future improvements planned:
- [ ] Multiple logo positions (top-left, top-right, center)
- [ ] Customizable text colors via API
- [ ] QR code support in watermark
- [ ] Batch processing endpoint
- [ ] Webhook notifications

### 🙏 Credits

Design improvements based on user feedback and modern UI/UX principles.
