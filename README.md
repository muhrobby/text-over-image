# Text Over Image API

API untuk menambahkan watermark otomatis pada gambar dengan informasi tanggal, jam, dan alamat. Dibangun dengan Node.js + Express, memproses sepenuhnya di memori (tidak menyimpan file di server), dan menjaga resolusi asli.

## 🚀 Fitur Utama

- ✅ Upload gambar dari file lokal dan URL
- ✅ Watermark otomatis dengan tanggal, jam (WIB), dan alamat
- ✅ Memory-only processing (no disk I/O)
- ✅ Tidak mengubah resolusi/format input
- ✅ Response binary atau JSON (data URL base64)
- ✅ Rate limiting (100 req/15 menit/IP)
- ✅ Format: JPG, PNG, WebP (maks. 10MB)
- ✅ Auto-wrap alamat (maks. 3 baris, elipsis)
- ✅ Header respons: `X-Original-Size`, `X-Processed-Size`, `X-Source-URL` (untuk URL upload)

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

2) Salin environment variables (opsional)

```bash
cp .env.example .env
```

3) Jalankan server

- Development

```bash
npm run dev
```

- Production

Saat ini script `start` mengarah ke file yang tidak ada. Jalankan langsung:

```bash
node src/server.js
```

Server: http://localhost:3000

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
```

Parameter:

- `image` (file, required): JPG/PNG/WebP, maks. 10MB
- `address` (text, optional): Alamat untuk watermark
- `format` (query, optional): `binary` (default) atau `json`

Contoh cURL:

```bash
# Binary (default)
curl -X POST \
  -F "image=@photo.jpg" \
  -F "address=Jl. Sudirman No. 123, Jakarta" \
  http://localhost:3000/upload

# JSON (gunakan query param)
curl -X POST \
  -F "image=@photo.jpg" \
  -F "address=Jl. Sudirman No. 123, Jakarta" \
  "http://localhost:3000/upload?format=json"
```

### 3) Upload dari URL

```http
POST /upload-url
Content-Type: application/json
```

Body:

```json
{
  "url": "https://example.com/image.jpg",
  "format": "json"
}
```

Catatan: Endpoint ini tidak menerima `address`. Bila Anda perlu alamat, gunakan endpoint upload file.

Contoh cURL:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/image.jpg","format":"json"}' \
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

- Posisi panel: bottom-left (opsi align kanan tersedia internal)
- Panel: rounded rectangle semi-transparan (rgba(0,0,0,0.01))
- Badge waktu: kotak putih + garis aksen + ikon jam + teks bold
- Format waktu: `DD MMM YYYY HH:mm:ss` (Asia/Jakarta)
- Alamat: auto-wrap, maks. 3 baris, elipsis saat kepanjangan
- Verified: ikon lingkaran hijau dengan centang + teks "Verified"
- Font: `Arial` (fallback sistem), ukuran dinamis berdasarkan lebar gambar

Contoh struktur multi-baris:

```
15 Sep 2024 10:30:45
Jl. Sudirman No. 123, Menteng, Jakarta Pusat, DKI Jakarta
Verified ✓
```

## 🔒 Keamanan & Performa

- Rate limiting: 100 request / 15 menit / IP
- Helmet untuk security headers, CORS configurable
- Validasi input dengan Joi
- Validasi tipe file (JPG/PNG/WebP) dan ukuran (<= 10MB)
- Validasi URL untuk mencegah SSRF; blokir host lokal (localhost, 127.0.0.1, ::1)

## 🌐 Contoh Frontend Singkat

```javascript
// Upload file -> JSON
async function uploadImage(file, address) {
  const formData = new FormData();
  formData.append("image", file);
  if (address) formData.append("address", address);
  const res = await fetch("/upload?format=json", { method: "POST", body: formData });
  return res.json();
}

// Upload dari URL -> JSON
async function uploadFromUrl(url) {
  const res = await fetch("/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format: "json" }),
  });
  return res.json();
}
```

## 🧪 Testing Cepat

```bash
# Health check
curl http://localhost:3000/health

# Upload file (JSON)
curl -X POST -F "image=@test.jpg" "http://localhost:3000/upload?format=json"

# Upload URL (JSON)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://picsum.photos/800/600","format":"json"}' \
  http://localhost:3000/upload-url

# Uji rate limiting
for i in {1..110}; do \
  curl -s -o /dev/null -w "%{http_code}\\n" -X POST -F "image=@test.jpg" http://localhost:3000/upload; \
done
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

### Environment Variables (opsional)

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com

# Catatan: WATERMARK_ADDRESS saat ini hanya dipakai pada contoh dokumentasi internal,
# bukan output watermark utama. Untuk watermark, kirim field address saat upload file.
WATERMARK_ADDRESS=Your Company, Your City
```

