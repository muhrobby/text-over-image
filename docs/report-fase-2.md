# FEATURE MAP

Fase ini hanya memetakan fitur yang terlihat dari kode aktual di `src/routes/`, `src/controllers/`, `src/services/`, `src/middleware/`, `src/utils/`, dan `openapi.yaml`. Tidak ada perubahan kode aplikasi pada fase ini.

## Fitur yang CONFIRMED ADA

| Fitur | File | Status | Catatan |
|-------|------|--------|---------|
| Upload image dari file lokal | `src/routes/index.js`, `src/controllers/imageController.js`, `src/middleware/validation.js` | ✅ Lengkap | Endpoint `POST /upload`; menggunakan Multer memory storage, validasi MIME/size, proses watermark, response binary atau JSON base64. |
| Upload image dari URL | `src/routes/index.js`, `src/controllers/imageController.js`, `src/middleware/validation.js` | ⚠️ Partial | Endpoint `POST /upload-url`; validasi URL dasar, download dengan Axios, validasi content-type dan size, proses watermark. SSRF protection ada secara dasar tetapi belum menutup semua private/internal IP range. Detail security masuk Fase 3. |
| Watermark timestamp | `src/services/imageService.js` | ✅ Lengkap | Timestamp default memakai timezone `Asia/Jakarta`; custom timestamp mendukung ISO 8601, SQL/MySQL, ISO tanpa timezone, `DD/MM/YYYY`, dan `DD-MM-YYYY`; validasi year `1900-2100`. |
| Watermark address | `src/services/imageService.js`, `src/controllers/imageController.js`, `src/middleware/validation.js` | ✅ Lengkap | Address request dibatasi max 500 chars, disanitasi, dibungkus otomatis, dan dibatasi max 5 baris secara default. |
| Brand logo overlay | `src/services/imageService.js`, `public/logo.png`, `public/logo.svg` | ✅ Lengkap | Service mencari `logo.png`, `logo.jpg`, `logo.jpeg`, `logo.webp`, `logo.svg` di `public/`; logo dirender di top-right jika ditemukan. |
| Responsive watermark layout | `src/services/imageService.js` | ✅ Lengkap | Font dan ukuran logo dihitung berdasarkan dimensi gambar; timestamp/address diletakkan bottom-right. |
| Output format preservation | `src/services/imageService.js`, `src/controllers/imageController.js` | ✅ Lengkap | Output mempertahankan format JPEG/PNG/WebP dengan quality/compression sesuai cabang format. |
| Response binary image | `src/controllers/imageController.js` | ✅ Lengkap | Default response mengirim buffer image dengan `Content-Type`, `Content-Length`, `Content-Disposition`, dan metadata size headers. |
| Response JSON base64 | `src/controllers/imageController.js` | ✅ Lengkap | Jika `format=json`, response berisi data URL base64, `size`, dan `originalSize`; upload URL juga menyertakan `sourceUrl`. |
| API token authentication | `src/middleware/auth.js`, `src/config/config.js` | ✅ Lengkap | `authenticateToken` memvalidasi `Authorization: Bearer <token>` atau fallback `?token=` jika `REQUIRE_AUTH=true` dan `API_TOKEN` tersedia. |
| Optional authentication middleware | `src/middleware/auth.js` | ⚠️ Partial | `optionalAuth` tersedia dan diekspor, tetapi tidak digunakan pada route yang ditemukan. |
| File upload validation | `src/middleware/validation.js`, `src/routes/index.js` | ✅ Lengkap | Validasi `format`, `address`, `time_created`, keberadaan file, ukuran file, dan MIME type. |
| URL upload validation | `src/middleware/validation.js` | ⚠️ Partial | Validasi URI, protocol HTTP/HTTPS, dan block hostname yang mengandung `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`; belum terlihat validasi private network lengkap. |
| Error handling global | `src/middleware/errorHandler.js`, `src/utils/errors.js` | ✅ Lengkap | `notFound` dan `errorHandler` tersedia; error response memakai `ApiResponse`; menangani Multer, Sharp unsupported format, payload too large, dan beberapa error generic. |
| Health check | `src/routes/index.js`, `src/controllers/imageController.js` | ✅ Lengkap | Endpoint `GET /health`; mengembalikan timestamp, uptime, memory usage, dan version dari `package.json`. |
| JSON API documentation endpoint | `src/routes/index.js`, `src/controllers/imageController.js` | ✅ Lengkap | Endpoint `GET /api`; mengembalikan dokumentasi ringkas dalam JSON. |
| Swagger UI documentation | `src/routes/index.js`, `openapi.yaml` | ✅ Lengkap | Endpoint `GET /api-docs`; load spec dari `openapi.yaml` menggunakan `yamljs` dan `swagger-ui-express`. |
| Static frontend/docs serving | `src/server.js`, `public/index.html`, `public/openapi.json` | ✅ Lengkap | `express.static` menyajikan folder `public/`. |
| Rate limiting | `src/server.js`, `src/config/config.js` | ✅ Lengkap | Global rate limit `100` request per `15` menit per IP dari `express-rate-limit`. |
| Security headers/CORS | `src/server.js`, `src/config/config.js` | ✅ Lengkap | Helmet dengan CSP/HSTS/noSniff/referrerPolicy dan CORS dari config. |
| Structured API response helper | `src/utils/response.js` | ✅ Lengkap | `ApiResponse` class dan static helper `success`/`error`. |
| Input sanitization helper | `src/utils/errors.js` | ✅ Lengkap | `sanitizeString` menghapus control chars, null bytes, basic `<script>` tags, dan inline event handler pattern. |
| Image buffer validation helper | `src/services/imageService.js` | ⚠️ Partial | Method `validateImageBuffer` ada, tetapi tidak terlihat dipakai oleh controller/route saat ini. |

Status legend:
- ✅ Lengkap: implemented dan terlihat dapat dipakai dari alur kode utama.
- ⚠️ Partial: ada implementasi tetapi cakupan terbatas, tidak dipakai, atau perlu verifikasi lanjutan.
- ❌ Stub: file/fungsi ada tapi implementasi kosong.
- 🔴 Broken: ada implementasi dan terlihat ada bug obvious dari pembacaan Fase 2.

## Fitur yang MUNGKIN direncanakan / indikasi lanjutan

| Indikasi | Lokasi | Keterangan |
|----------|--------|------------|
| `optionalAuth` diekspor tetapi tidak digunakan | `src/middleware/auth.js:49` | Kemungkinan disiapkan untuk endpoint publik yang tetap menerima token opsional. Belum ada route yang memakainya. |
| `validate` generic middleware diekspor tetapi tidak digunakan | `src/middleware/validation.js:114` | Kemungkinan utility untuk route lain yang belum ada. |
| `validateImageBuffer` tidak terlihat dipakai | `src/services/imageService.js:532` | Kemungkinan helper untuk reuse/validasi terpisah, tapi alur utama langsung validasi di `addWatermark`. |
| `generateWatermarkText` deprecated legacy method | `src/services/imageService.js:551` | Method lama masih ada untuk compatibility menurut komentar, tetapi tidak ditemukan pemakaiannya. |
| `calculateFontSize` deprecated legacy method | `src/services/imageService.js:563` | Method lama masih ada untuk compatibility menurut komentar, tetapi tidak ditemukan pemakaiannya. |
| Mongoose error handling | `src/middleware/errorHandler.js:30` | Handler untuk `CastError`, duplicate key, dan validation error ada, tetapi tidak ditemukan database/Mongoose pada Fase 2. Kemungkinan template/legacy code. |

## API Endpoints yang ditemukan

| Method | Path | Auth? | File | Handler |
|--------|------|-------|------|---------|
| GET | `/health` | ❌ | `src/routes/index.js` | `imageController.healthCheck` |
| POST | `/upload` | ✅ jika `REQUIRE_AUTH=true` dan `API_TOKEN` tersedia | `src/routes/index.js` | `authenticateToken` → `upload.single("image")` → `validateFileUpload` → `imageController.uploadFile` |
| POST | `/upload-url` | ✅ jika `REQUIRE_AUTH=true` dan `API_TOKEN` tersedia | `src/routes/index.js` | `authenticateToken` → `validateUrlUpload` → `imageController.uploadFromUrl` |
| GET | `/api` | ❌ | `src/routes/index.js` | `imageController.getDocumentation` |
| GET | `/api-docs` | ❌ | `src/routes/index.js` | `swaggerUi.setup(swaggerDocument)` |
| USE | `/api-docs` | ❌ | `src/routes/index.js` | `swaggerUi.serve` |

Catatan auth: `authenticateToken` akan skip authentication jika `config.auth.requireAuth` false atau `config.auth.apiToken` kosong. Jadi route `POST /upload` dan `POST /upload-url` secara kode memasang middleware auth, tetapi enforcement bergantung pada environment.

## Dependency Antar Fitur

| Fitur | Bergantung pada | Catatan |
|-------|-----------------|---------|
| Server bootstrap | `express`, `helmet`, `cors`, `express-rate-limit`, `morgan`, `src/routes`, `src/config/config.js`, `errorHandler` | Semua route dimount di `/`. |
| Upload file | `multer`, `authenticateToken`, `validateFileUpload`, `imageController.uploadFile`, `imageService.addWatermark` | File disimpan di memory, bukan disk. |
| Upload URL | `authenticateToken`, `validateUrlUpload`, `axios`, `imageService.addWatermark` | Download image dilakukan di controller sebelum image processing. |
| Watermark rendering | `sharp`, `moment-timezone`, `fs.promises`, `path`, `public/logo.*` | SVG overlay dibuat string lalu dikomposit ke image menggunakan Sharp. |
| Authentication | `src/config/config.js`, `AppError` | Static token dari env, bukan JWT. |
| Validation | `joi`, `config.upload`, `AppError` | Validasi request dilakukan sebelum controller untuk route upload. |
| Error response | `ApiResponse`, `AppError` | Global error middleware membungkus semua error menjadi JSON response. |
| Swagger docs | `swagger-ui-express`, `yamljs`, `openapi.yaml` | OpenAPI spec dibaca saat route module diload. |

## Catatan Konsistensi Awal

- `openapi.yaml` mencantumkan `bearerFormat: JWT`, tetapi implementasi auth memakai static API token, bukan JWT.
- `imageController.getDocumentation` mengembalikan `version: "1.0.0"`, sementara `package.json`, README badge, dan OpenAPI memakai `2.1.0`.
- Dokumentasi JSON di `getDocumentation` masih menyebut format watermark dengan `Verified`, sedangkan `imageService.js` komentar desain baru menyatakan `NO verified badge` dan fungsi SVG saat ini tidak membangun verified badge.
- `GET /api-docs` tidak diproteksi auth, meskipun README menyebut semua endpoint kecuali `/health` dan `/api` membutuhkan auth. Berdasarkan route aktual, `/api-docs` publik.

## Ringkasan Fase 2

Project memiliki fitur utama yang sudah terhubung: upload file/URL, validasi input, API token auth, image watermarking, output binary/JSON, health check, dan dokumentasi Swagger. Area yang terlihat partial terutama pada cakupan SSRF protection, helper/middleware yang belum digunakan, dan beberapa inkonsistensi dokumentasi/versioning yang perlu dievaluasi lebih lanjut pada Fase 3 Health Check.

**Status Fase:** Fase 2 selesai. Belum ada perubahan kode aplikasi.
