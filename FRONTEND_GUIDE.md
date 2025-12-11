# 🎨 Image Watermark API - Frontend Guide

## 📱 Accessing the Frontend

### Web Interface
Visit `http://localhost:3000` to access the interactive web interface.

### Features

#### 1. **Demo Interface** (Try Demo Tab)
- **File Upload**: Drag & drop or select image files
- **URL Upload**: Enter image URL to process
- **Custom Address**: Add your own address text
- **Live Preview**: See results immediately
- **Download**: Download processed images

#### 2. **API Documentation** (API Documentation Tab)
- Complete endpoint reference
- Request/response examples
- cURL examples
- Error codes and messages

### Swagger UI Documentation
Access interactive API documentation at:
```
http://localhost:3000/api-docs
```

Features:
- Try out API endpoints directly in browser
- See all request/response schemas
- Download OpenAPI specification
- View all parameters and examples

## 🚀 Quick Start

### 1. Upload from File

1. Go to `http://localhost:3000`
2. Click "Try Demo" tab
3. Select "Upload File"
4. Choose an image file (JPG, PNG, WebP)
5. (Optional) Enter custom address
6. Click "Add Watermark"
7. View result and download

### 2. Upload from URL

1. Go to `http://localhost:3000`
2. Click "Try Demo" tab
3. Select "From URL"
4. Enter image URL (e.g., `https://example.com/photo.jpg`)
5. (Optional) Enter custom address
6. Click "Add Watermark"
7. View result and download

## 📊 Response Formats

### Binary Response (Default)
Returns processed image directly as binary data.

**Use case**: Direct image display, download links

### JSON Response
Returns base64 encoded image in JSON format.

**Use case**: AJAX requests, API integration

Example:
```json
{
  "success": true,
  "message": "Image processed successfully",
  "timestamp": "2025-11-11T12:00:00.000Z",
  "data": {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "size": 1234567,
    "originalSize": 987654
  }
}
```

## 🎯 Integration Examples

### JavaScript (Fetch API)

#### File Upload
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('address', 'Jl. Sudirman, Jakarta');
formData.append('format', 'json');

const response = await fetch('/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// result.data.image contains the watermarked image
```

#### URL Upload
```javascript
const response = await fetch('/upload-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com/photo.jpg',
    address: 'Jakarta, Indonesia',
    format: 'json'
  })
});

const result = await response.json();
```

### jQuery

```javascript
// File Upload
const formData = new FormData();
formData.append('image', $('#fileInput')[0].files[0]);
formData.append('address', 'Custom address');

$.ajax({
  url: '/upload',
  type: 'POST',
  data: formData,
  processData: false,
  contentType: false,
  success: function(data) {
    $('#result').attr('src', data.data.image);
  }
});
```

### Python (requests)

```python
import requests

# File Upload
files = {'image': open('photo.jpg', 'rb')}
data = {'address': 'Jakarta, Indonesia', 'format': 'json'}

response = requests.post('http://localhost:3000/upload', 
                        files=files, data=data)
result = response.json()

# URL Upload
response = requests.post('http://localhost:3000/upload-url',
                        json={
                            'url': 'https://example.com/photo.jpg',
                            'address': 'Jakarta',
                            'format': 'json'
                        })
result = response.json()
```

### cURL

```bash
# File Upload (Binary)
curl -X POST http://localhost:3000/upload \
  -F "image=@photo.jpg" \
  -F "address=Jakarta, Indonesia" \
  -o watermarked.jpg

# URL Upload (JSON)
curl -X POST http://localhost:3000/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/photo.jpg",
    "address": "Jakarta",
    "format": "json"
  }'
```

## 🎨 Customization

### Address Format
The address will be automatically wrapped to maximum 3 lines. For best results:

**Good:**
```
Jalan Sudirman No. 123, Jakarta Pusat, DKI Jakarta
```

**Better:**
```
Jalan Sudirman No. 123, Kelurahan Karet Tengsin, Kecamatan Tanah Abang, Jakarta Pusat, DKI Jakarta
```

The system will intelligently wrap at commas for natural line breaks.

### Watermark Position
Currently fixed to bottom-left. Can be customized via theme configuration in `src/config/config.js`.

## 📋 Requirements

### Image Requirements
- **Formats**: JPG, JPEG, PNG, WebP
- **Max Size**: 10MB
- **Min Dimensions**: 100x100px (recommended)
- **Max Dimensions**: No limit (will scale watermark accordingly)

### Address Requirements
- **Max Length**: 500 characters
- **Encoding**: UTF-8 (supports special characters)
- **Optional**: Will use default if not provided

## 🔒 Security Notes

### CORS
By default, CORS is enabled for all origins (`*`). For production, configure in `.env`:
```env
CORS_ORIGIN=https://yourdomain.com
```

### Rate Limiting
- 100 requests per 15 minutes per IP
- Applies to all endpoints
- Returns 429 status when exceeded

### URL Upload Security
- Local URLs (localhost, 127.0.0.1) are blocked
- Only HTTP/HTTPS protocols allowed
- Validates content-type from server
- Max download size: 10MB

## 🐛 Error Handling

### Common Errors

**400 Bad Request**
- Invalid file format
- File too large
- Invalid URL
- Missing required parameters

**408 Request Timeout**
- URL download took too long (30s timeout)

**429 Too Many Requests**
- Rate limit exceeded
- Wait 15 minutes or contact support

**500 Internal Server Error**
- Image processing failed
- Contact support with timestamp

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-11-11T12:00:00.000Z",
  "meta": {
    "statusCode": 400
  }
}
```

## 📊 Performance Tips

### For Best Performance
1. **Use appropriate image sizes**: Larger images take longer to process
2. **Compress before upload**: Reduce file size when possible
3. **Use binary format**: Faster than JSON for direct downloads
4. **Cache results**: Store processed images if reusing

### Processing Times (Approximate)
- Small images (< 1MB): 200-500ms
- Medium images (1-5MB): 500-1500ms
- Large images (5-10MB): 1500-3000ms

## 🔄 Updates & Changelog

### Version 2.0.0
- ✅ Complete frontend redesign
- ✅ Interactive Swagger UI documentation
- ✅ Support for custom addresses in URL upload
- ✅ Improved error handling and validation
- ✅ Better mobile responsiveness

### Version 1.0.0
- Initial release with basic functionality

## 📞 Support

### Documentation
- Web UI: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI Spec: `openapi.yaml`

### Resources
- API Documentation: [WATERMARK_GUIDE.md](../WATERMARK_GUIDE.md)
- Code Review: [CODE_REVIEW_SUMMARY.md](../CODE_REVIEW_SUMMARY.md)
- Changelog: [CHANGELOG.md](../CHANGELOG.md)

---

Made with ❤️ for professional image watermarking
