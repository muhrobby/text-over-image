# 🎨 Text Over Image API

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/yourusername/text-over-image)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

Professional RESTful API for adding customizable watermarks to images with timestamp, address, and brand logo. Built with Node.js, Express, and Sharp for high-performance image processing.

---

## ✨ Features

### Core Functionality
- 🖼️ **Professional Watermarking** - Clean, modern design with auto-adjusting typography
- 🕒 **Custom Timestamp** - Set any date/time or use current timestamp
- 📍 **Smart Address Formatting** - Auto text wrapping up to 5 lines with intelligent comma splitting
- 🎨 **Brand Logo Support** - Auto-loaded from public folder, displayed in top-right corner
- 💾 **Quality Preservation** - Maintains original resolution and format (JPG, PNG, WebP)
- ⚡ **In-Memory Processing** - No disk I/O, blazing fast performance

### Security & Performance
- 🔐 **API Token Authentication** - Secure Bearer token authentication
- 🛡️ **Input Sanitization** - Prevents XSS, injection attacks, and SSRF
- ⏱️ **Rate Limiting** - 100 requests per 15 minutes per IP
- 🚫 **SSRF Protection** - Blocks access to local/private URLs
- 📊 **Comprehensive Logging** - Production-ready error handling

### Developer Experience
- 📚 **OpenAPI 3.0 Documentation** - Interactive Swagger UI at `/api-docs`
- 🐳 **Docker Ready** - Production-optimized Dockerfile included
- 🔧 **Easy Configuration** - Environment-based config with sensible defaults
- 🎯 **TypeScript Friendly** - Clean, documented API responses

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [Configuration](#-configuration)
- [Docker Deployment](#-docker-deployment)
- [Usage Examples](#-usage-examples)
- [API Reference](#-api-reference)
- [Watermark Customization](#-watermark-customization)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **(Optional)** Docker for containerized deployment

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/text-over-image.git
cd text-over-image

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit configuration

# Generate secure API token
openssl rand -hex 32  # Copy output to .env as API_TOKEN

# Start server
npm start
```

Server will start at `http://localhost:3000`

### Quick Test

```bash
# Health check
curl http://localhost:3000/health

# Test with authentication
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer your-api-token" \
  -F "image=@photo.jpg" \
  -F "address=Jakarta, Indonesia" \
  --output result.jpg
```

---

## 🔐 Authentication

All API endpoints (except `/health` and `/api`) require Bearer token authentication.

### Setup

1. **Enable Authentication** in `.env`:
```env
REQUIRE_AUTH=true
API_TOKEN=your-secure-token-here
```

2. **Generate Secure Token**:
```bash
# Linux/Mac
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Usage

**Header (Recommended)**:
```bash
Authorization: Bearer your-api-token
```

**Query Parameter (Fallback)**:
```bash
?token=your-api-token
```

### Example Requests

```bash
# cURL with Bearer token
curl -X POST https://your-api.com/upload \
  -H "Authorization: Bearer abc123..." \
  -F "image=@photo.jpg"

# JavaScript fetch
fetch('https://your-api.com/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer abc123...'
  },
  body: formData
})

# Python requests
headers = {'Authorization': 'Bearer abc123...'}
response = requests.post('https://your-api.com/upload', 
                        headers=headers, 
                        files=files)
```

---

## 📖 API Endpoints

### `POST /upload` - Upload File

Upload image file with optional custom timestamp and address.

**Request (multipart/form-data)**:
```
image         (file, required)   - JPG/PNG/WebP, max 10MB
address       (string, optional) - Custom address (max 500 chars)
time_created  (string, optional) - ISO 8601 datetime (e.g., 2024-12-25T14:30:00+07:00)
format        (string, optional) - Response format: "binary" (default) or "json"
```

**Response Headers**:
```
X-Original-Size: 1234567      (bytes)
X-Processed-Size: 1456789     (bytes)
```

### `POST /upload-url` - Upload from URL

Download image from URL and add watermark.

**Request (application/json)**:
```json
{
  "url": "https://example.com/image.jpg",
  "address": "Jakarta, Indonesia",
  "time_created": "2024-12-25T14:30:00+07:00",
  "format": "binary"
}
```

### `GET /health` - Health Check

Check API status (no authentication required).

**Response**:
```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "data": {
    "uptime": 3600.5,
    "memory": { "heapUsed": 50000000 },
    "version": "2.1.0"
  }
}
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```env
# ==========================================
# SERVER CONFIGURATION
# ==========================================
PORT=3000
NODE_ENV=production

# ==========================================
# API AUTHENTICATION (REQUIRED)
# ==========================================
REQUIRE_AUTH=true
API_TOKEN=your-secret-token-here

# ==========================================
# CORS CONFIGURATION
# ==========================================
CORS_ORIGIN=https://yourdomain.com  # Use * for all origins

# ==========================================
# WATERMARK CONFIGURATION
# ==========================================
WATERMARK_ADDRESS=Your Company, Your City
```

### Add Brand Logo

Place your logo in `public/` folder:
```bash
# Supported formats
public/logo.png
public/logo.jpg
public/logo.svg
public/logo.webp
```

Logo will auto-load and display in top-right corner (15% of image width, 150-500px).

---

## 🐳 Docker Deployment

### Build and Run

```bash
# Build image
docker build -t text-over-image-api .

# Run container
docker run -d \
  -p 3000:3000 \
  -e REQUIRE_AUTH=true \
  -e API_TOKEN=your-secure-token \
  -e NODE_ENV=production \
  --name watermark-api \
  text-over-image-api
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REQUIRE_AUTH=true
      - API_TOKEN=${API_TOKEN}
      - CORS_ORIGIN=https://yourdomain.com
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Dockploy Deployment

1. **Connect Repository** to Dockploy
2. **Set Environment Variables**:
   - `REQUIRE_AUTH=true`
   - `API_TOKEN=<generate-secure-token>`
   - `NODE_ENV=production`
3. **Deploy** - Dockploy will auto-build using Dockerfile
4. **Add Custom Domain** (optional)
5. **Enable HTTPS** via Dockploy SSL

---

## 💡 Usage Examples

### cURL

```bash
# Basic upload with current timestamp
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer your-token" \
  -F "image=@photo.jpg" \
  -o watermarked.jpg

# Upload with custom timestamp and address
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer your-token" \
  -F "image=@photo.jpg" \
  -F "address=Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta" \
  -F "time_created=2024-12-25T14:30:00+07:00" \
  -o result.jpg

# Upload from URL (JSON response)
curl -X POST http://localhost:3000/upload-url \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/image.jpg",
    "address": "Jakarta, Indonesia",
    "time_created": "2024-12-25T14:30:00+07:00",
    "format": "json"
  }'
```

### JavaScript/TypeScript

```javascript
// Using fetch with file upload
async function uploadImage(file, address, customTime, token) {
  const formData = new FormData();
  formData.append('image', file);
  if (address) formData.append('address', address);
  if (customTime) formData.append('time_created', customTime);
  formData.append('format', 'json');

  const response = await fetch('https://your-api.com/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
}

// Using fetch with URL upload
async function uploadFromUrl(imageUrl, address, token) {
  const response = await fetch('https://your-api.com/upload-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: imageUrl,
      address: address,
      time_created: new Date().toISOString(),
      format: 'json'
    })
  });

  return await response.json();
}

// Example usage
const result = await uploadImage(
  fileInput.files[0],
  'Jakarta, Indonesia',
  '2024-12-25T14:30:00+07:00',
  'your-api-token'
);

console.log('Processed image:', result.data.image);
```

### Python

```python
import requests
from datetime import datetime

def upload_image(file_path, address=None, custom_time=None, token=None):
    """Upload image file with watermark"""
    url = 'https://your-api.com/upload'
    headers = {'Authorization': f'Bearer {token}'}
    
    files = {'image': open(file_path, 'rb')}
    data = {}
    
    if address:
        data['address'] = address
    if custom_time:
        data['time_created'] = custom_time
    
    response = requests.post(url, headers=headers, files=files, data=data)
    
    # Save binary response
    with open('watermarked.jpg', 'wb') as f:
        f.write(response.content)
    
    return response

def upload_from_url(image_url, address=None, token=None):
    """Upload image from URL"""
    url = 'https://your-api.com/upload-url'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'url': image_url,
        'address': address or 'Default Address',
        'time_created': datetime.now().isoformat(),
        'format': 'json'
    }
    
    response = requests.post(url, headers=headers, json=payload)
    return response.json()

# Example usage
result = upload_image(
    'photo.jpg',
    address='Jakarta, Indonesia',
    custom_time='2024-12-25T14:30:00+07:00',
    token='your-api-token'
)

print(f"Status: {result.status_code}")
```

### PHP

```php
<?php
function uploadImage($filePath, $address = null, $customTime = null, $token = null) {
    $url = 'https://your-api.com/upload';
    
    $headers = [
        'Authorization: Bearer ' . $token
    ];
    
    $file = new CURLFile($filePath);
    $postData = ['image' => $file];
    
    if ($address) $postData['address'] = $address;
    if ($customTime) $postData['time_created'] = $customTime;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $result = curl_exec($ch);
    curl_close($ch);
    
    return $result;
}

// Example usage
$result = uploadImage(
    'photo.jpg',
    'Jakarta, Indonesia',
    '2024-12-25T14:30:00+07:00',
    'your-api-token'
);

file_put_contents('watermarked.jpg', $result);
?>
```

---

## 📚 API Reference

### Request Formats

#### Custom Timestamp Format

Use ISO 8601 format with timezone:

```
2024-12-25T14:30:00+07:00  ✅ Correct (with timezone)
2024-12-25T14:30:00Z       ✅ Correct (UTC)
2024-12-25T14:30:00        ❌ Incorrect (no timezone)
25/12/2024 14:30           ❌ Incorrect (wrong format)
```

### Response Formats

#### Binary Response (default)

```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Length: 1456789
X-Original-Size: 1234567
X-Processed-Size: 1456789

[Binary image data]
```

#### JSON Response

```json
{
  "success": true,
  "message": "Image processed successfully",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "data": {
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "size": 1456789,
    "originalSize": 1234567
  }
}
```

### Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "meta": {
    "statusCode": 400
  }
}
```

**Common Status Codes**:
- `400` - Bad request (invalid input, format, size)
- `401` - Unauthorized (missing/invalid API token)
- `403` - Forbidden (valid token but access denied)
- `408` - Request timeout (URL download timeout)
- `429` - Too many requests (rate limit exceeded)
- `500` - Internal server error

---

## 🎨 Watermark Customization

### Watermark Layout

```
┌────────────────────────────────┐
│                    [LOGO] ←────│  Logo: Top-right, 15% width
│                                │
│                                │
│         25 Dec 2024 | 14:30 ←──│  Timestamp: Professional format
│         Jl. Sudirman No. 123 ←─│  Address: Right-aligned
│         Jakarta Selatan      ←─│  Auto-wrapped, max 5 lines
└────────────────────────────────┘
```

### Typography

- **Responsive Sizing** - Font scales based on image dimensions (base: 1200px width)
- **Professional Fonts** - Inter, Segoe UI, Roboto, Helvetica Neue, Arial (fallback cascade)
- **Text Outline** - 4px black stroke for visibility on any background
- **Consistent Sizing** - Timestamp and address use same font size for visual harmony

### Customization

To customize watermark appearance, edit `src/services/imageService.js`:

```javascript
const DEFAULT_THEME = {
  outerPad: 32,            // Margin from edge
  innerPad: 16,            // Internal padding
  lineGap: 8,              // Gap between lines
  timeColor: "#FFFFFF",    // Timestamp text color
  textColor: "#FFFFFF",    // Address text color
  strokeColor: "#000000",  // Outline color
  logoSize: 180,           // Base logo size
  baseAddressFontSize: 40  // Base font size
};
```

---

## 🔒 Security Best Practices

### Production Deployment

1. **Always enable authentication**:
   ```env
   REQUIRE_AUTH=true
   ```

2. **Use strong API tokens** (32+ characters):
   ```bash
   openssl rand -hex 32
   ```

3. **Set specific CORS origin**:
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

4. **Use HTTPS** in production (enforce via reverse proxy)

5. **Monitor rate limits** and adjust if needed in `src/config/config.js`

6. **Review logs** regularly for suspicious activity

### Security Features

- ✅ Input sanitization (XSS prevention)
- ✅ File type validation (whitelist only)
- ✅ File size limits (10MB max)
- ✅ SSRF protection (blocks local URLs)
- ✅ Rate limiting per IP
- ✅ Secure headers (Helmet.js)
- ✅ No file storage (memory-only processing)

---

## 🧪 Development

```bash
# Install dependencies
npm install

# Run development server (auto-reload)
npm run dev

# Run production server
npm start

# Generate API documentation
npx js-yaml openapi.yaml > public/openapi.json
```

### Project Structure

```
text-over-image/
├── src/
│   ├── config/
│   │   └── config.js           # App configuration
│   ├── controllers/
│   │   └── imageController.js  # Request handlers
│   ├── middleware/
│   │   ├── auth.js             # Authentication
│   │   ├── errorHandler.js     # Error handling
│   │   └── validation.js       # Input validation
│   ├── routes/
│   │   └── index.js            # Route definitions
│   ├── services/
│   │   └── imageService.js     # Image processing logic
│   ├── utils/
│   │   ├── errors.js           # Custom errors
│   │   └── response.js         # Response formatting
│   └── server.js               # App entry point
├── public/
│   ├── index.html              # Demo UI
│   ├── logo.png                # Brand logo
│   └── openapi.json            # API spec (generated)
├── .env                        # Environment config
├── Dockerfile                  # Docker build
├── docker-compose.yml          # Docker Compose
├── openapi.yaml                # API specification
└── package.json                # Dependencies
```

---

## 📊 Performance

- **Processing Speed** - Average 50-100ms per image (1920x1080)
- **Memory Usage** - ~50MB baseline, scales with concurrent requests
- **Throughput** - 100+ requests per second (depends on hardware)
- **Max File Size** - 10MB (configurable)

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing library
- [Express](https://expressjs.com/) - Fast, minimalist web framework
- [Moment.js](https://momentjs.com/) - Timezone handling
- [Helmet](https://helmetjs.github.io/) - Security middleware

---

## 📞 Support

- **Documentation**: [API Docs](http://localhost:3000/api-docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/text-over-image/issues)
- **Email**: support@example.com

---

**Made with ❤️ for developers who need reliable image watermarking**
