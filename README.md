# Text Over Image API

API untuk menambahkan watermark otomatis pada gambar dengan informasi tanggal, jam, dan alamat. API ini dibangun dengan Node.js dan Express.js menggunakan arsitektur modular.

## 🚀 Fitur Utama

- ✅ Upload gambar dari file lokal dan URL
- ✅ Watermark otomatis dengan tanggal, jam, dan alamat
- ✅ Tidak menyimpan file di server (memory-only processing)
- ✅ Mempertahankan kualitas/resolusi gambar original
- ✅ Response binary atau JSON dengan base64
- ✅ Rate limiting untuk keamanan
- ✅ Support multiple format: JPG, PNG, WebP
- ✅ File size limit 10MB
- ✅ Font size dinamis berdasarkan resolusi gambar
- ✅ Drop shadow untuk readability

## 📦 Struktur Project

```
text-over-image-api/
├── config/
│   └── config.js                 # Konfigurasi aplikasi
├── controllers/
│   └── imageController.js        # Controller untuk handling request
├── services/
│   └── imageService.js          # Business logic untuk image processing
├── middleware/
│   ├── errorHandler.js          # Error handling middleware
│   └── validation.js            # Request validation
├── routes/
│   └── index.js                 # Route definitions
├── utils/
│   ├── response.js              # Response formatting utilities
│   └── errors.js                # Custom error classes
├── server.js                    # Entry point aplikasi
├── package.json                 # Dependencies dan scripts
├── .env.example                 # Environment variables example
└── README.md                    # Dokumentasi
```

## 🛠 Installation & Setup

### Prerequisites

- Node.js >= 16.0.0
- npm atau yarn

### Steps

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd text-over-image-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   # Edit .env file sesuai kebutuhan
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Start production server**
   ```bash
   npm start
   ```

Server akan berjalan di `http://localhost:3000`

## 📚 API Endpoints

### 1. Health Check

```http
GET /health
```

**Response:**

```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600.123,
    "memory": {...},
    "version": "1.0.0"
  }
}
```

### 2. Upload File Lokal

```http
POST /upload
Content-Type: multipart/form-data
```

**Parameters:**

- `image` (file): File gambar (JPG/PNG/WebP, max 10MB)
- `format` (query, optional): Response format (`binary` atau `json`)

**Example cURL:**

```bash
# Binary response (default)
curl -X POST -F "image=@photo.jpg" http://localhost:3000/upload

# JSON response
curl -X POST -F "image=@photo.jpg" "http://localhost:3000/upload?format=json"
```

### 3. Upload dari URL

```http
POST /upload-url
Content-Type: application/json
```

**Body:**

```json
{
  "url": "https://example.com/image.jpg",
  "format": "json"
}
```

**Example cURL:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/image.jpg","format":"json"}' \
  http://localhost:3000/upload-url
```

### 4. Dokumentasi API

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
    "originalSize": 1000000
  }
}
```

## 🎨 Watermark Specifications

- **Posisi**: Bottom-left corner
- **Background**: Gradient semi-transparan dengan border subtle
- **Font**: Arial, bold untuk tanggal/waktu, normal untuk alamat
- **Color**: White (#FFFFFF) untuk teks, Green (#10B981) untuk "Verified"
- **Drop Shadow**: 2px offset dengan blur 3px
- **Icon**: Green check mark dengan circle background
- **Format Multi-line**:
  ```
  DD/MM/YYYY HH:mm:ss
  [Alamat yang panjang otomatis
  terbagi ke beberapa baris]
  Verified ✓
  ```

### Format Layout:

1. **Baris 1**: Tanggal dan waktu (format Indonesia)
2. **Baris 2+**: Alamat (auto-wrap jika panjang)
3. **Baris terakhir**: "Verified" dengan icon checklist hijau

**Example Output:**

```
15/01/2024 10:30:45
Jl. Sudirman No. 123, Menteng,
Jakarta Pusat, DKI Jakarta
Verified ✓
```

## 🔒 Keamanan & Performance

### Rate Limiting

- **Limit**: 100 requests per 15 menit per IP
- **Headers**: Standar rate limit headers

### Security Headers

- Helmet.js untuk security headers
- CORS configuration
- Input validation dengan Joi
- File type validation
- URL validation untuk mencegah SSRF

### File Restrictions

- **Max size**: 10MB
- **Allowed formats**: JPG, JPEG, PNG, WebP
- **Blocked**: Local URLs (localhost, 127.0.0.1)

## 💡 Keuntungan Memory-Only Processing

### 1. **Security**

- Tidak ada file tersimpan di server
- Menghindari disk space attacks
- Tidak perlu cleanup mechanism

### 2. **Performance**

- Processing langsung di memory
- Tidak ada I/O disk overhead
- Horizontal scaling lebih mudah

### 3. **Privacy**

- File tidak tersimpan permanent
- Automatic cleanup setelah response
- GDPR compliant

### 4. **Scalability**

- Stateless application
- Container-friendly
- Easy deployment

## 🌐 Frontend Implementation Examples

### JavaScript/Fetch API

```javascript
// Upload file
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/upload?format=json", {
    method: "POST",
    body: formData,
  });

  return await response.json();
}

// Upload from URL
async function uploadFromUrl(imageUrl) {
  const response = await fetch("/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: imageUrl,
      format: "json",
    }),
  });

  return await response.json();
}
```

### React Hook Example

```jsx
import { useState } from "react";

function ImageUploader() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/upload?format=json", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleUpload(e.target.files[0])}
      />
      {loading && <p>Processing...</p>}
      {result?.success && (
        <img
          src={result.data.image}
          alt="Watermarked"
          style={{ maxWidth: "100%" }}
        />
      )}
    </div>
  );
}
```

### HTML Form Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Image Watermark API</title>
  </head>
  <body>
    <h1>Upload Image</h1>

    <!-- File Upload Form -->
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="image" accept="image/*" required />
      <button type="submit">Upload & Watermark</button>
    </form>

    <!-- URL Upload Form -->
    <form id="urlForm">
      <input
        type="url"
        id="imageUrl"
        placeholder="https://example.com/image.jpg"
        required
      />
      <button type="submit">Process URL</button>
    </form>

    <div id="result"></div>

    <script>
      document
        .getElementById("urlForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const url = document.getElementById("imageUrl").value;

          try {
            const response = await fetch("/upload-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url, format: "json" }),
            });

            const data = await response.json();

            if (data.success) {
              document.getElementById(
                "result"
              ).innerHTML = `<img src="${data.data.image}" style="max-width: 100%;">`;
            }
          } catch (error) {
            console.error("Error:", error);
          }
        });
    </script>
  </body>
</html>
```

## 🧪 Testing

### Manual Testing

```bash
# Test health check
curl http://localhost:3000/health

# Test file upload
curl -X POST -F "image=@test.jpg" http://localhost:3000/upload?format=json

# Test URL upload
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://picsum.photos/800/600","format":"json"}' \
  http://localhost:3000/upload-url
```

### Load Testing dengan curl

```bash
# Test rate limiting
for i in {1..110}; do
  echo "Request $i"
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST -F "image=@test.jpg" http://localhost:3000/upload
done
```

## 📊 Monitoring & Logging

### Health Check Response

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600.123,
    "memory": {
      "rss": 50331648,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576,
      "arrayBuffers": 524288
    },
    "version": "1.0.0"
  }
}
```

### Error Logging

Aplikasi secara otomatis log error dengan informasi:

- Error message dan stack trace
- Request URL dan method
- User IP dan User Agent
- Timestamp

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables untuk Production

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com
WATERMARK_ADDRESS=Your Company, Your City
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

Jika ada pertanyaan atau issue:

1. Buka GitHub Issues
2. Email: support@yourcompany.com
3. Documentation: API endpoint `/` untuk dokumentasi lengkap
