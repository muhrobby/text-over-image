# API Authentication Guide

## Overview

API ini mendukung autentikasi menggunakan API Token untuk mengamankan endpoint upload. Token dapat diaktifkan/dinonaktifkan melalui environment variable.

## Konfigurasi

### Environment Variables

Edit file `.env`:

```env
# API Authentication (optional)
# Set REQUIRE_AUTH=true to enable API token authentication
REQUIRE_AUTH=true
API_TOKEN=your-secret-api-token-here
```

**Parameter:**
- `REQUIRE_AUTH`: Set ke `true` untuk mengaktifkan autentikasi (default: `false`)
- `API_TOKEN`: Token rahasia yang digunakan untuk autentikasi

## Cara Menggunakan API Token

Ada 2 cara mengirim token ke API:

### 1. Melalui Authorization Header (Recommended)

```bash
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer your-secret-api-token-here" \
  -F "image=@photo.jpg" \
  -F "address=Jakarta, Indonesia"
```

### 2. Melalui Query Parameter

```bash
curl -X POST "http://localhost:3000/upload?token=your-secret-api-token-here" \
  -F "image=@photo.jpg" \
  -F "address=Jakarta, Indonesia"
```

## Contoh Request

### Upload File dengan Token

**cURL:**
```bash
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer your-secret-api-token-here" \
  -F "image=@photo.jpg" \
  -F "address=Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta"
```

**JavaScript (Fetch API):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('address', 'Jl. Sudirman No. 123, Jakarta Selatan');

fetch('http://localhost:3000/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-secret-api-token-here'
  },
  body: formData
})
.then(response => response.blob())
.then(blob => {
  // Handle image blob
  const url = URL.createObjectURL(blob);
  document.getElementById('result').src = url;
});
```

**Python (requests):**
```python
import requests

url = "http://localhost:3000/upload"
headers = {
    "Authorization": "Bearer your-secret-api-token-here"
}
files = {
    "image": open("photo.jpg", "rb")
}
data = {
    "address": "Jl. Sudirman No. 123, Jakarta Selatan"
}

response = requests.post(url, headers=headers, files=files, data=data)
with open("result.jpg", "wb") as f:
    f.write(response.content)
```

### Upload dari URL dengan Token

**cURL:**
```bash
curl -X POST http://localhost:3000/upload-url \
  -H "Authorization: Bearer your-secret-api-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/image.jpg",
    "address": "Jl. Sudirman No. 123, Jakarta Selatan",
    "format": "binary"
  }'
```

## Response Errors

### 401 Unauthorized
Token tidak dikirim:
```json
{
  "success": false,
  "error": "API token is required. Use header 'Authorization: Bearer <token>' or query parameter '?token=<token>'"
}
```

### 403 Forbidden
Token tidak valid:
```json
{
  "success": false,
  "error": "Invalid API token"
}
```

## Testing

### Development (Auth Disabled)
Untuk development, set `REQUIRE_AUTH=false` di `.env`:
```env
REQUIRE_AUTH=false
```

Request tanpa token akan berhasil:
```bash
curl -X POST http://localhost:3000/upload \
  -F "image=@photo.jpg" \
  -F "address=Jakarta, Indonesia"
```

### Production (Auth Enabled)
Untuk production, set `REQUIRE_AUTH=true` dan gunakan token yang kuat:
```env
REQUIRE_AUTH=true
API_TOKEN=generated-strong-random-token-here
```

## Generating Strong Tokens

**Node.js:**
```javascript
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
console.log(token);
```

**Bash:**
```bash
openssl rand -hex 32
```

**Python:**
```python
import secrets
token = secrets.token_hex(32)
print(token)
```

## Endpoints yang Memerlukan Autentikasi

| Endpoint | Method | Auth Required |
|----------|--------|---------------|
| `/upload` | POST | Yes (if enabled) |
| `/upload-url` | POST | Yes (if enabled) |
| `/health` | GET | No |
| `/api` | GET | No |
| `/api-docs` | GET | No |

## Security Best Practices

1. **Gunakan HTTPS** di production
2. **Jangan commit token** ke version control
3. **Rotate token** secara berkala
4. **Gunakan token yang panjang** (minimal 32 characters)
5. **Store token dengan aman** di environment variables atau secret manager
6. **Monitor failed authentication attempts**

## Troubleshooting

### Token tidak terdeteksi
Pastikan format header benar:
```
Authorization: Bearer your-token-here
```

Bukan:
```
Authorization: your-token-here  ❌
Bearer your-token-here  ❌
```

### Token valid tapi tetap error
1. Periksa spasi atau karakter hidden di token
2. Pastikan `REQUIRE_AUTH=true` di `.env`
3. Restart server setelah mengubah `.env`
