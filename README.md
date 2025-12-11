# Text Over Image API

API untuk menambahkan watermark otomatis pada gambar dengan informasi tanggal, jam, dan alamat. Dibangun dengan Node.js + Express, memproses sepenuhnya di memori (tidak menyimpan file di server), dan menjaga resolusi asli.

## 🚀 Fitur Utama

- ✅ Upload gambar dari file lokal dan URL
- ✅ Watermark otomatis dengan tanggal, jam (WIB), dan alamat
- ✅ **NEW v2.1:** Logo brand di pojok kanan atas (besar, transparan, proporsional)
- ✅ **NEW v2.1:** Watermark profesional di pojok kanan bawah (timestamp + address)
- ✅ **NEW v2.1:** Font alamat lebih besar untuk visibility optimal
- ✅ **NEW v2.1:** Timestamp format profesional (DD MMM YYYY | HH:mm:ss)
- ✅ **NEW v2.1:** Desain minimalis & clean (no verified badge)
- ✅ **NEW:** Text dengan outline/stroke untuk visibility di berbagai background
- ✅ **NEW:** Auto line wrapping untuk alamat panjang (max 5 baris)
- ✅ **NEW:** API Token Authentication (optional)
- ✅ Memory-only processing (no disk I/O)
- ✅ Tidak mengubah resolusi/format input
- ✅ Response binary atau JSON (data URL base64)
- ✅ Rate limiting (100 req/15 menit/IP)
- ✅ Format: JPG, PNG, WebP (maks. 10MB)
- ✅ Header respons: `X-Original-Size`, `X-Processed-Size`, `X-Source-URL` (untuk URL upload)

## 🎨 What's New (v2.1.0) - Professional Design

### New Layout
```
┌────────────────────────────────┐
│                    [LOGO] ←────│  Logo: Kanan atas, besar, transparan
│                                │
│                                │
│         DD MMM YYYY | HH:mm ←──│  Timestamp: Format profesional
│         Jl. Alamat Lengkap  ←──│  Address: Font besar, right-aligned
│         Jakarta Selatan     ←──│  Position: Kanan bawah
└────────────────────────────────┘
```

### Design Changes
- **Logo:** Top-right corner, 7% dari lebar gambar (80-200px), opacity 0.95
- **Watermark:** Bottom-right corner (timestamp + address, right-aligned)
- **Timestamp:** Professional format `DD MMM YYYY | HH:mm:ss` (no badge, no icon)
- **Address:** Font 24px base (lebih besar dari sebelumnya), max 5 lines
- **Removed:** Verified badge dihapus untuk tampilan lebih clean
- **Style:** Minimalis, profesional, tidak norak

## 📦 Struktur Project

```
text-over-image/
├── src/
│   ├── config/config.js
│   ├── controllers/imageController.js
│   ├── middleware/{errorHandler,validation}.js
│   ├── routes/index.js
│   ├── services/imageService.js
│   └── utils/{response,errors}.js
├── src/server.js
├── package.json
├── .env.example
└── README.md
```

## 🛠 Installation & Setup

### Prasyarat

- Node.js >= 18 (disarankan 20, sesuai Dockerfile)
- npm atau yarn

### Langkah

1) Clone repo dan install dependencies

```bash
git clone <repository-url>
cd text-over-image
npm install
```

2) Salin dan edit environment variables

```bash
cp .env.example .env
```

**Edit `.env` untuk konfigurasi:**
```env
# Server
PORT=3000
NODE_ENV=development

# API Authentication (optional)
REQUIRE_AUTH=false          # Set true untuk enable auth
API_TOKEN=your-token-here   # Generate dengan: openssl rand -hex 32

# Watermark
WATERMARK_ADDRESS=Jakarta, Indonesia

# CORS
CORS_ORIGIN=*
```

3) **(Optional)** Tambah logo brand

```bash
# Taruh logo di folder public/
cp your-logo.png public/logo.png
# Support: logo.png, logo.jpg, logo.svg, logo.webp
```

3) Jalankan server

**Development:**

```bash
npm run dev
```

**Production:**

```bash
node src/server.js
```

Server berjalan di: http://localhost:3000  
API Docs: http://localhost:3000/api-docs

## 📚 API Endpoints

### 1) Health Check

```http
GET /health
```

Contoh respons singkat:

```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600.123,
    "memory": {"rss": 50331648, "heapTotal": 20971520, "heapUsed": 15728640},
    "version": "1.0.0"
  }
}
```

### 2) Upload File (Lokal)

```http
POST /upload
Content-Type: multipart/form-data
Authorization: Bearer <token>  (optional, jika auth enabled)
```

Parameter:

- `image` (file, required): JPG/PNG/WebP, maks. 10MB
- `address` (text, optional): Alamat untuk watermark (auto wrap hingga 5 baris)
- `format` (query, optional): `binary` (default) atau `json`

Contoh cURL:

```bash
# Binary (default) - tanpa auth
curl -X POST \
  -F "image=@photo.jpg" \
  -F "address=Jl. Sudirman No. 123, RT.001/RW.002, Jakarta Selatan" \
  http://localhost:3000/upload

# Dengan API token authentication
curl -X POST \
  -H "Authorization: Bearer your-api-token" \
  -F "image=@photo.jpg" \
  -F "address=Jl. Sudirman No. 123, Jakarta" \
  http://localhost:3000/upload

# JSON response (gunakan query param)
curl -X POST \
  -F "image=@photo.jpg" \
  -F "address=Jl. Sudirman No. 123, Jakarta" \
  "http://localhost:3000/upload?format=json"
```

### 3) Upload dari URL

```http
POST /upload-url
Content-Type: application/json
Authorization: Bearer <token>  (optional, jika auth enabled)
```

Body:

```json
{
  "url": "https://example.com/image.jpg",
  "address": "Jl. Sudirman No. 123, Jakarta",
  "format": "binary"
}
```

Contoh cURL:

```bash
# Binary response
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/image.jpg","address":"Jakarta, Indonesia","format":"binary"}' \
  http://localhost:3000/upload-url \
  --output result.jpg

# Dengan auth token
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-token" \
  -d '{"url":"https://picsum.photos/1920/1080","address":"Jakarta","format":"json"}' \
  http://localhost:3000/upload-url
```

### 4) Dokumentasi Ringkas (JSON)

```http
GET /
```

## 📝 Response Format

### Binary Response

```http
Content-Type: image/jpeg
Content-Length: 1234567
Content-Disposition: inline; filename="watermarked-image.jpg"
X-Original-Size: 1000000
X-Processed-Size: 1234567
X-Source-URL: https://example.com/image.jpg   # hanya untuk /upload-url

[Binary image data]
```

### JSON Response

```json
{
  "success": true,
  "message": "Image processed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
    "size": 1234567,
    "originalSize": 1000000,
    "sourceUrl": "https://example.com/image.jpg"
  }
}
```

## 🎨 Watermark Specifications

### Desain Timestamp (v2.0.0)
- **Posisi:** Bottom-left (default)
- **Background Panel:** ❌ Dihapus (text langsung di atas gambar)
- **Text Visibility:** Outline/stroke hitam 4px untuk kontras optimal
- **Badge waktu:** Rounded rectangle putih + yellow stripe + clock icon + bold text
- **Format waktu:** `DD MMM YYYY HH:mm:ss` (Asia/Jakarta timezone)
- **Alamat:** Auto-wrap smart (max 5 baris), prioritas split di koma, ellipsis jika terlalu panjang
- **Logo Brand:** Auto load dari `public/logo.{png|jpg|svg|webp}`, ditampilkan di badge "Verified"
- **Verified Badge:** Green checkmark circle atau custom logo + text dengan outline
- **Font:** `Inter, Segoe UI, DejaVu Sans, Arial` (fallback cascade), ukuran responsive berdasarkan lebar gambar

### Visual Structure:
```
[Time Badge with Yellow Stripe] 15 Dec 2024 14:30:45
                                                      ← White background + clock icon
Jl. Sudirman No. 123,                                ← Text dengan black outline
RT.001/RW.002, Kelurahan Karet,
Jakarta Selatan, DKI Jakarta

[Logo] Verified                                       ← Brand logo + checkmark
```

### Text Outline for Visibility:
```svg
<!-- Black stroke untuk outline -->
<text stroke="#000" stroke-width="4" fill="none">Text</text>
<!-- White fill untuk warna -->
<text fill="#FFFFFF">Text</text>
```

## 🔒 Keamanan & Performa

### Security Features
- **API Token Authentication** (optional): Bearer token via header atau query parameter
  - Konfigurasi: `REQUIRE_AUTH=true` dan `API_TOKEN=xxx` di `.env`
  - Dokumentasi lengkap: [AUTH_GUIDE.md](./AUTH_GUIDE.md)
- **Rate limiting:** 100 request / 15 menit per IP
- **Helmet** untuk security headers
- **CORS** configurable via environment variable
- **Input validation** dengan Joi schema
- **File validation:** Type (JPG/PNG/WebP) dan size (<= 10MB)
- **URL validation:** Prevent SSRF, block local hosts (localhost, 127.0.0.1, ::1)
- **Memory-only processing:** Tidak ada file tersimpan di disk

### Performance
- In-memory image processing dengan Sharp (libvips)
- Streaming response untuk file besar
- Automatic format preservation
- Compression optimization (JPEG quality 95, PNG level 9)

## 🌐 Contoh Frontend Singkat

### JavaScript (Fetch API)

```javascript
// Upload file -> JSON (dengan auth)
async function uploadImage(file, address, token = null) {
  const formData = new FormData();
  formData.append("image", file);
  if (address) formData.append("address", address);
  
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch("/upload?format=json", { 
    method: "POST", 
    headers,
    body: formData 
  });
  return res.json();
}

// Upload dari URL -> Binary (dengan auth)
async function uploadFromUrl(url, address, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch("/upload-url", {
    method: "POST",
    headers,
    body: JSON.stringify({ url, address, format: "binary" }),
  });
  return res.blob();
}

// Usage
const blob = await uploadFromUrl(
  "https://picsum.photos/1920/1080",
  "Jakarta, Indonesia",
  "your-api-token"
);
document.getElementById("result").src = URL.createObjectURL(blob);
```

### Python (requests)

```python
import requests

# Upload file dengan auth
url = "http://localhost:3000/upload"
headers = {"Authorization": "Bearer your-api-token"}
files = {"image": open("photo.jpg", "rb")}
data = {"address": "Jakarta, Indonesia"}

response = requests.post(url, headers=headers, files=files, data=data)
with open("result.jpg", "wb") as f:
    f.write(response.content)

# Upload from URL dengan auth
url = "http://localhost:3000/upload-url"
headers = {
    "Authorization": "Bearer your-api-token",
    "Content-Type": "application/json"
}
payload = {
    "url": "https://picsum.photos/1920/1080",
    "address": "Jakarta, Indonesia",
    "format": "binary"
}

response = requests.post(url, headers=headers, json=payload)
with open("result.jpg", "wb") as f:
    f.write(response.content)
```

## 🧪 Testing Cepat

```bash
# Health check
curl http://localhost:3000/health

# Upload file (binary, tanpa auth)
curl -X POST \
  -F "image=@test.jpg" \
  -F "address=Jl. Sudirman No. 123, Jakarta Selatan" \
  http://localhost:3000/upload \
  --output result.jpg

# Upload file (JSON, dengan auth)
curl -X POST \
  -H "Authorization: Bearer your-api-token" \
  -F "image=@test.jpg" \
  -F "address=Jakarta" \
  "http://localhost:3000/upload?format=json"

# Upload URL (binary)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://picsum.photos/1920/1080","address":"Jakarta, Indonesia","format":"binary"}' \
  http://localhost:3000/upload-url \
  --output result.jpg

# Test dengan alamat panjang (auto wrap)
curl -X POST \
  -F "image=@test.jpg" \
  -F "address=Jl. Jenderal Sudirman No. 123, RT.001/RW.002, Kelurahan Karet Tengsin, Kecamatan Tanah Abang, Jakarta Pusat, DKI Jakarta 10250" \
  http://localhost:3000/upload \
  --output result-long-address.jpg

# Uji rate limiting (expect 429 setelah request ke-100)
for i in {1..110}; do \
  curl -s -o /dev/null -w "Request $i: %{http_code}\\n" \
  -X POST -F "image=@test.jpg" http://localhost:3000/upload; \
done

# Test auth - should fail without token (jika REQUIRE_AUTH=true)
curl -X POST \
  -F "image=@test.jpg" \
  http://localhost:3000/upload

# Test auth - should succeed with token
curl -X POST \
  -H "Authorization: Bearer your-api-token" \
  -F "image=@test.jpg" \
  http://localhost:3000/upload \
  --output result-auth.jpg
```

## 📊 Logging

Error otomatis dilog dengan informasi pesan, stack trace, URL, method, IP, User-Agent, dan timestamp. Respons error memakai format JSON konsisten.

## 🚀 Deployment

### Docker

Repo menyertakan Dockerfile yang menjalankan `node src/server.js` secara langsung.

```bash
docker build -t text-over-image:latest .
docker run --rm -p 3000:3000 text-over-image:latest
```

### Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# API Authentication (optional)
REQUIRE_AUTH=true
API_TOKEN=generated-strong-token-here  # Generate: openssl rand -hex 32

# CORS
CORS_ORIGIN=https://yourdomain.com

# Watermark (optional)
WATERMARK_ADDRESS=Your Company, Your City
```

### Brand Logo
Taruh logo di `public/logo.{png|jpg|svg|webp}` sebelum deploy.

## 📚 Dokumentasi Lengkap

- **[UPDATE_SUMMARY.md](./UPDATE_SUMMARY.md)** - Summary semua perubahan dan cara testing
- **[AUTH_GUIDE.md](./AUTH_GUIDE.md)** - Panduan lengkap API Token Authentication
- **[DESIGN_CHANGELOG.md](./DESIGN_CHANGELOG.md)** - Detail perubahan desain timestamp
- **[WATERMARK_GUIDE.md](./WATERMARK_GUIDE.md)** - Customization watermark (advanced)
- **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)** - Integrasi frontend
- **[API Docs (Swagger)](http://localhost:3000/api-docs)** - Interactive API documentation

## 🆕 What's New in v2.0.0

### Design Improvements
- ✅ **No background panel** - Text dengan outline untuk maximum visibility
- ✅ **Smart address wrapping** - Auto wrap hingga 5 baris dengan intelligent comma splitting
- ✅ **Brand logo support** - Auto load dari folder public/
- ✅ **Better typography** - Responsive font sizing, improved contrast

### Security & Features
- ✅ **API Token Authentication** - Optional protection untuk endpoints
- ✅ **Bug fixes** - Fixed validation error di `/upload-url`
- ✅ **Enhanced documentation** - Comprehensive guides untuk semua fitur

### Migration dari v1.x
Tidak ada breaking changes - semua API calls existing akan tetap bekerja. Fitur baru bersifat optional dan dapat diaktifkan via konfigurasi.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

[MIT License](LICENSE) - feel free to use in your projects

## 🙏 Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) - High performance Node.js image processing
- [Express](https://expressjs.com/) - Fast, unopinionated web framework
- [Moment Timezone](https://momentjs.com/timezone/) - Timezone support
- Community contributors and testers

---

**Made with ❤️ for developers who need reliable image watermarking**

